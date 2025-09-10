// src/lib/workers/analyze-sentiment.ts
import { PrismaClient } from '@prisma/client'
import { AnalysisEngine } from '../analysis'

const prisma = new PrismaClient()

export async function analyzeSentiment(commentId: string): Promise<void> {
  try {
    // Get comment details
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      throw new Error(`Comment not found: ${commentId}`)
    }

    // Check if analysis already exists
    const existingAnalysis = await prisma.analysis.findFirst({
      where: { commentId: comment.id }
    })

    if (existingAnalysis) {
      console.log(`Analysis already exists for comment ${commentId}`)
      return
    }

    // Initialize analysis engine
    const engine = new AnalysisEngine()

    // Perform analysis
    console.log(`Analyzing sentiment for comment ${commentId}`)
    const result = await engine.analyze(comment.message)

    // Store analysis results
    await prisma.analysis.create({
      data: {
        commentId: comment.id,
        language: result.language,
        sentimentLabel: result.sentimentLabel,
        sentimentScore: result.sentimentScore,
        toxicityScore: result.toxicityScore,
        keywords: result.keywords || [],
        claims: result.claims || [],
        factualAccuracy: result.factualAccuracy,
        modelName: result.modelName,
        modelVersion: result.modelVersion,
        analyzedAt: new Date()
      }
    })

    console.log(`Successfully analyzed comment ${commentId} - Sentiment: ${result.sentimentLabel} (${result.sentimentScore.toFixed(2)})`)

  } catch (error) {
    console.error(`Error analyzing sentiment for comment ${commentId}:`, error)
    throw error
  }
}

