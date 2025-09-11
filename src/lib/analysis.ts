// src/lib/analysis.ts
import { Sentiment } from '@prisma/client'

// Analysis result interface
export interface AnalysisResult {
  sentimentLabel: Sentiment
  sentimentScore: number // 0-1 confidence
  toxicityScore: number // 0-1 toxicity level
  language?: string
  keywords?: string[]
  claims?: string[]
  factualAccuracy?: 'True' | 'False' | 'Misleading' | 'Unverified'
  modelName: string
  modelVersion?: string
}

// Base analyzer interface
export interface SentimentAnalyzer {
  analyze(text: string): Promise<AnalysisResult>
  isAvailable(): Promise<boolean>
  getName(): string
}

// Local Node.js analyzer using @xenova/transformers
export class LocalTransformersAnalyzer implements SentimentAnalyzer {
  private pipeline: unknown = null
  private toxicityPipeline: unknown = null
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Dynamic import to avoid issues during build
      const { pipeline } = await import('@xenova/transformers')
      
      // Initialize sentiment analysis pipeline
      this.pipeline = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      )

      // Initialize toxicity detection pipeline
      this.toxicityPipeline = await pipeline(
        'text-classification',
        'Xenova/toxic-bert'
      )

      this.initialized = true
      console.log('Local transformers analyzer initialized')
    } catch (error) {
      console.error('Failed to initialize local analyzer:', error)
      throw error
    }
  }

  async analyze(text: string): Promise<AnalysisResult> {
    await this.initialize()

    try {
      // Sentiment analysis
      const sentimentResult = await this.pipeline(text)
      const sentiment = sentimentResult[0]

      // Map labels to our enum
      let sentimentLabel: Sentiment
      switch (sentiment.label.toLowerCase()) {
        case 'positive':
          sentimentLabel = Sentiment.POSITIVE
          break
        case 'negative':
          sentimentLabel = Sentiment.NEGATIVE
          break
        default:
          sentimentLabel = Sentiment.NEUTRAL
      }

      // Toxicity analysis
      const toxicityResult = await this.toxicityPipeline(text)
      const toxicityScore = toxicityResult.find((r: {
        label: string
        score: number
      }) => 
        r.label.toLowerCase().includes('toxic')
      )?.score || 0

      // Simple keyword extraction (basic implementation)
      const keywords = this.extractKeywords(text)

      return {
        sentimentLabel,
        sentimentScore: sentiment.score,
        toxicityScore,
        language: this.detectLanguage(text),
        keywords,
        modelName: 'xenova-distilbert-sst2',
        modelVersion: '1.0'
      }
    } catch (error) {
      console.error('Error in local analysis:', error)
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize()
      return true
    } catch {
      return false
    }
  }

  getName(): string {
    return 'Local Transformers'
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - remove stop words and get frequent terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
    ])

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))

    // Get word frequency
    const wordCount = new Map<string, number>()
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // Return top 5 keywords
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  private detectLanguage(text: string): string {
    // Simple language detection - could be enhanced with a proper library
    const englishWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'that', 'it', 'with']
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no']
    const frenchWords = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir']

    const lowerText = text.toLowerCase()
    
    let englishScore = 0
    let spanishScore = 0
    let frenchScore = 0

    englishWords.forEach(word => {
      if (lowerText.includes(word)) englishScore++
    })
    spanishWords.forEach(word => {
      if (lowerText.includes(word)) spanishScore++
    })
    frenchWords.forEach(word => {
      if (lowerText.includes(word)) frenchScore++
    })

    if (spanishScore > englishScore && spanishScore > frenchScore) return 'es'
    if (frenchScore > englishScore && frenchScore > spanishScore) return 'fr'
    return 'en' // Default to English
  }
}

// OpenAI analyzer (external API)
export class OpenAIAnalyzer implements SentimentAnalyzer {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || ''
  }

  async analyze(text: string): Promise<AnalysisResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: `Analyze the sentiment, toxicity, and extract keywords from the given text. 
            Respond with a JSON object containing:
            - sentiment: "POSITIVE", "NEGATIVE", or "NEUTRAL"
            - confidence: number between 0 and 1
            - toxicity: number between 0 and 1
            - language: detected language code (e.g., "en", "es", "fr")
            - keywords: array of up to 5 relevant keywords
            - claims: array of factual claims made in the text
            - factualAccuracy: "True", "False", "Misleading", or "Unverified" for the overall content`
          }, {
            role: 'user',
            content: text
          }],
          temperature: 0.1,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)

      return {
        sentimentLabel: result.sentiment as Sentiment,
        sentimentScore: result.confidence,
        toxicityScore: result.toxicity,
        language: result.language,
        keywords: result.keywords,
        claims: result.claims,
        factualAccuracy: result.factualAccuracy,
        modelName: 'openai-gpt-3.5-turbo',
        modelVersion: '3.5'
      }
    } catch (error) {
      console.error('Error in OpenAI analysis:', error)
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  getName(): string {
    return 'OpenAI GPT-3.5'
  }
}

// Azure Cognitive Services analyzer
export class AzureAnalyzer implements SentimentAnalyzer {
  private apiKey: string
  private endpoint: string

  constructor(apiKey?: string, endpoint?: string) {
    this.apiKey = apiKey || process.env.AZURE_API_KEY || ''
    this.endpoint = endpoint || process.env.AZURE_ENDPOINT || ''
  }

  async analyze(text: string): Promise<AnalysisResult> {
    if (!this.apiKey || !this.endpoint) {
      throw new Error('Azure API key or endpoint not configured')
    }

    try {
      // Sentiment analysis
      const sentimentResponse = await fetch(`${this.endpoint}/text/analytics/v3.1/sentiment`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documents: [{
            id: '1',
            text: text,
            language: 'en'
          }]
        })
      })

      const sentimentData = await sentimentResponse.json()
      const sentiment = sentimentData.documents[0].sentiment
      const confidence = sentimentData.documents[0].confidenceScores

      // Key phrase extraction
      const keyPhraseResponse = await fetch(`${this.endpoint}/text/analytics/v3.1/keyPhrases`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documents: [{
            id: '1',
            text: text,
            language: 'en'
          }]
        })
      })

      const keyPhraseData = await keyPhraseResponse.json()
      const keywords = keyPhraseData.documents[0].keyPhrases

      // Map Azure sentiment to our enum
      let sentimentLabel: Sentiment
      switch (sentiment.toLowerCase()) {
        case 'positive':
          sentimentLabel = Sentiment.POSITIVE
          break
        case 'negative':
          sentimentLabel = Sentiment.NEGATIVE
          break
        default:
          sentimentLabel = Sentiment.NEUTRAL
      }

      return {
        sentimentLabel,
        sentimentScore: confidence[sentiment.toLowerCase()],
        toxicityScore: 0, // Azure doesn't provide toxicity in basic tier
        language: 'en',
        keywords: keywords.slice(0, 5),
        modelName: 'azure-text-analytics',
        modelVersion: '3.1'
      }
    } catch (error) {
      console.error('Error in Azure analysis:', error)
      throw error
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.apiKey && this.endpoint)
  }

  getName(): string {
    return 'Azure Text Analytics'
  }
}

// Analysis engine that manages multiple analyzers
export class AnalysisEngine {
  private analyzers: SentimentAnalyzer[] = []
  private preferredAnalyzer: string | null = null

  constructor() {
    // Initialize available analyzers
    this.analyzers = [
      new LocalTransformersAnalyzer(),
      new OpenAIAnalyzer(),
      new AzureAnalyzer()
    ]
  }

  async getAvailableAnalyzers(): Promise<SentimentAnalyzer[]> {
    const available: SentimentAnalyzer[] = []
    
    for (const analyzer of this.analyzers) {
      if (await analyzer.isAvailable()) {
        available.push(analyzer)
      }
    }

    return available
  }

  async analyze(text: string, preferredAnalyzer?: string): Promise<AnalysisResult> {
    const available = await this.getAvailableAnalyzers()
    
    if (available.length === 0) {
      throw new Error('No sentiment analyzers available')
    }

    // Use preferred analyzer if specified and available
    let analyzer = available[0] // Default to first available
    
    if (preferredAnalyzer) {
      const preferred = available.find(a => a.getName().toLowerCase().includes(preferredAnalyzer.toLowerCase()))
      if (preferred) {
        analyzer = preferred
      }
    }

    console.log(`Using analyzer: ${analyzer.getName()}`)
    return await analyzer.analyze(text)
  }

  setPreferredAnalyzer(analyzerName: string): void {
    this.preferredAnalyzer = analyzerName
  }

  getPreferredAnalyzer(): string | null {
    return this.preferredAnalyzer
  }
}

