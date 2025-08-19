// src/lib/analysis.ts
import OpenAI from 'openai'

export interface SentimentResult {
  label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  score: number
  confidence: number
}

export interface ToxicityResult {
  score: number
  categories: {
    toxicity: number
    severe_toxicity: number
    identity_attack: number
    insult: number
    threat: number
    sexual_explicit: number
  }
}

export interface AnalysisResult {
  sentiment: SentimentResult
  toxicity: ToxicityResult
  keywords: string[]
  language: string
}

interface OpenAIResponse {
  sentiment: {
    label: string
    score: number
    confidence: number
  }
  toxicity: {
    score: number
    reasoning: string
  }
  keywords: string[]
  language: string
}

interface LocalAnalysisConfig {
  model: 'local' | 'openai'
  apiKey?: string
}

export class SentimentAnalyzer {
  private openai: OpenAI | null = null
  private config: LocalAnalysisConfig

  constructor(config: LocalAnalysisConfig = { model: 'local' }) {
    this.config = config
    
    if (config.model === 'openai' && config.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.apiKey
      })
    }
  }

  async analyzeText(text: string): Promise<AnalysisResult> {
    if (this.config.model === 'openai' && this.openai) {
      return this.analyzeWithOpenAI(text)
    } else {
      return this.analyzeLocally(text)
    }
  }

  private async analyzeWithOpenAI(text: string): Promise<AnalysisResult> {
    try {
      const prompt = `
        Analyze the following text for sentiment, toxicity, and extract keywords.
        Return a JSON response with this exact structure:
        {
          "sentiment": {
            "label": "POSITIVE|NEGATIVE|NEUTRAL",
            "score": 0.0-1.0,
            "confidence": 0.0-1.0
          },
          "toxicity": {
            "score": 0.0-1.0,
            "reasoning": "brief explanation"
          },
          "keywords": ["keyword1", "keyword2", "keyword3"],
          "language": "en|es|fr|etc"
        }

        Text to analyze: "${text.replace(/"/g, '\\"')}"
      `

      const response = await this.openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      const result: OpenAIResponse = JSON.parse(content)
      
      return {
        sentiment: {
          label: result.sentiment.label as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL',
          score: result.sentiment.score,
          confidence: result.sentiment.confidence
        },
        toxicity: {
          score: result.toxicity.score,
          categories: {
            toxicity: result.toxicity.score,
            severe_toxicity: result.toxicity.score * 0.3,
            identity_attack: result.toxicity.score * 0.2,
            insult: result.toxicity.score * 0.4,
            threat: result.toxicity.score * 0.1,
            sexual_explicit: result.toxicity.score * 0.1
          }
        },
        keywords: result.keywords,
        language: result.language
      }

    } catch (error) {
      console.error('OpenAI analysis failed:', error)
      // Fallback to local analysis
      return this.analyzeLocally(text)
    }
  }

  private async analyzeLocally(text: string): Promise<AnalysisResult> {
    // Simple rule-based sentiment analysis
    const sentiment = this.analyzeSentimentLocally(text)
    const toxicity = this.analyzeToxicityLocally(text)
    const keywords = this.extractKeywords(text)
    const language = this.detectLanguage(text)

    return {
      sentiment,
      toxicity,
      keywords,
      language
    }
  }

  private analyzeSentimentLocally(text: string): SentimentResult {
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
      'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'perfect',
      'beautiful', 'brilliant', 'outstanding', 'superb', 'magnificent'
    ]

    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'disgusting', 'hate', 'dislike',
      'angry', 'frustrated', 'disappointed', 'upset', 'annoyed', 'furious',
      'worst', 'pathetic', 'useless', 'stupid', 'ridiculous', 'outrageous'
    ]

    const words = text.toLowerCase().split(/\W+/)
    let positiveScore = 0
    let negativeScore = 0

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++
      if (negativeWords.includes(word)) negativeScore++
    })

    const totalScore = positiveScore + negativeScore
    if (totalScore === 0) {
      return { label: 'NEUTRAL', score: 0.5, confidence: 0.6 }
    }

    const positiveRatio = positiveScore / totalScore
    const confidence = Math.min(totalScore / 10, 0.9) + 0.1

    if (positiveRatio > 0.6) {
      return { label: 'POSITIVE', score: positiveRatio, confidence }
    } else if (positiveRatio < 0.4) {
      return { label: 'NEGATIVE', score: 1 - positiveRatio, confidence }
    } else {
      return { label: 'NEUTRAL', score: 0.5, confidence: confidence * 0.8 }
    }
  }

  private analyzeToxicityLocally(text: string): ToxicityResult {
    const toxicWords = [
      'hate', 'kill', 'die', 'stupid', 'idiot', 'moron', 'dumb', 'loser',
      'pathetic', 'disgusting', 'sick', 'crazy', 'insane', 'retard'
    ]

    const severeWords = [
      'kill', 'die', 'murder', 'suicide', 'bomb', 'terrorist', 'nazi'
    ]

    const words = text.toLowerCase().split(/\W+/)
    let toxicCount = 0
    let severeCount = 0

    words.forEach(word => {
      if (toxicWords.includes(word)) toxicCount++
      if (severeWords.includes(word)) severeCount++
    })

    const toxicityScore = Math.min((toxicCount + severeCount * 2) / words.length * 10, 1)

    return {
      score: toxicityScore,
      categories: {
        toxicity: toxicityScore,
        severe_toxicity: severeCount > 0 ? Math.min(severeCount / words.length * 20, 1) : 0,
        identity_attack: toxicityScore * 0.3,
        insult: toxicCount > 0 ? Math.min(toxicCount / words.length * 15, 1) : 0,
        threat: severeCount > 0 ? Math.min(severeCount / words.length * 25, 1) : 0,
        sexual_explicit: 0 // Would need more sophisticated detection
      }
    }
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
      'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
      'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its',
      'our', 'their'
    ])

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))

    // Count word frequency
    const wordCount = new Map<string, number>()
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // Return top 5 most frequent words
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  private detectLanguage(text: string): string {
    // Very simple language detection based on common words
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with']
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no']
    const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir']

    const words = text.toLowerCase().split(/\W+/)
    
    let englishScore = 0
    let spanishScore = 0
    let frenchScore = 0

    words.forEach(word => {
      if (englishWords.includes(word)) englishScore++
      if (spanishWords.includes(word)) spanishScore++
      if (frenchWords.includes(word)) frenchScore++
    })

    if (englishScore >= spanishScore && englishScore >= frenchScore) return 'en'
    if (spanishScore >= frenchScore) return 'es'
    if (frenchScore > 0) return 'fr'
    
    return 'en' // Default to English
  }
}

// Factory function for creating analyzer instances
export function createAnalyzer(config?: LocalAnalysisConfig): SentimentAnalyzer {
  const defaultConfig: LocalAnalysisConfig = {
    model: process.env.OPENAI_API_KEY ? 'openai' : 'local',
    apiKey: process.env.OPENAI_API_KEY
  }

  return new SentimentAnalyzer({ ...defaultConfig, ...config })
}

