// src/lib/queue.ts
import { PrismaClient, JobType, JobStatus } from '@prisma/client'

const prisma = new PrismaClient()

interface JobData {
  postId?: string
  commentId?: string
  pageId?: string
  dateRange?: {
    since: string
    until: string
  }
  platform?: 'FACEBOOK' | 'INSTAGRAM'
  [key: string]: string | number | boolean | object | undefined
}

export class JobQueue {
  private static instance: JobQueue
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): JobQueue {
    if (!JobQueue.instance) {
      JobQueue.instance = new JobQueue()
    }
    return JobQueue.instance
  }

  // Add a job to the queue
  async enqueue(
    type: JobType,
    payload: JobPayload,
    maxAttempts: number = 3,
    scheduledAt?: Date
  ): Promise<string> {
    const job = await prisma.job.create({
      data: {
        type,
        payload: payload as JobData,
        maxAttempts,
        scheduledAt: scheduledAt || new Date(),
        status: JobStatus.QUEUED
      }
    })

    return job.id
  }

  // Get next job to process
  async getNextJob(): Promise<{
    id: string
    type: JobType
    payload: JobData
    attempts: number
    maxAttempts: number
  } | null> {
    const job = await prisma.job.findFirst({
      where: {
        status: JobStatus.QUEUED,
        scheduledAt: {
          lte: new Date()
        },
        attempts: {
          lt: prisma.job.fields.maxAttempts
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    })

    if (job) {
      // Mark as running
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.RUNNING,
          startedAt: new Date(),
          attempts: {
            increment: 1
          }
        }
      })
    }

    return job
  }

  // Mark job as completed
  async completeJob(jobId: string): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date()
      }
    })
  }

  // Mark job as failed
  async failJob(jobId: string, error: string): Promise<void> {
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    })

    if (!job) return

    const shouldRetry = job.attempts < job.maxAttempts
    const nextScheduledAt = shouldRetry 
      ? new Date(Date.now() + this.calculateBackoffDelay(job.attempts))
      : undefined

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: shouldRetry ? JobStatus.QUEUED : JobStatus.FAILED,
        lastError: error,
        scheduledAt: nextScheduledAt,
        startedAt: null
      }
    })
  }

  // Calculate exponential backoff delay
  private calculateBackoffDelay(attempts: number): number {
    const baseDelay = 1000 // 1 second
    const maxDelay = 300000 // 5 minutes
    return Math.min(baseDelay * Math.pow(2, attempts), maxDelay)
  }

  // Start processing jobs
  startProcessing(intervalMs: number = 5000): void {
    if (this.isProcessing) return

    this.isProcessing = true
    this.processingInterval = setInterval(async () => {
      await this.processNextJob()
    }, intervalMs)

    console.log('Job queue processing started')
  }

  // Stop processing jobs
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
    this.isProcessing = false
    console.log('Job queue processing stopped')
  }

  // Process a single job
  private async processNextJob(): Promise<void> {
    try {
      const job = await this.getNextJob()
      if (!job) return

      console.log(`Processing job ${job.id} of type ${job.type}`)

      switch (job.type) {
        case JobType.FETCH_POSTS:
          await this.processFetchPostsJob(job)
          break
        case JobType.FETCH_COMMENTS:
          await this.processFetchCommentsJob(job)
          break
        case JobType.ANALYZE_SENTIMENT:
          await this.processAnalyzeSentimentJob(job)
          break
        case JobType.REFRESH_TOKENS:
          await this.processRefreshTokensJob(job)
          break
        case JobType.CLEANUP_DATA:
          await this.processCleanupDataJob(job)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      await this.completeJob(job.id)
      console.log(`Job ${job.id} completed successfully`)
    } catch (error) {
      console.error('Error processing job:', error)
      if (error instanceof Error && 'jobId' in error) {
        await this.failJob((error as Error & { jobId: string }).jobId, error.message)
      }
    }
  }

  // Job processors
  private async processFetchPostsJob(job: {
    id: string
    type: JobType
    payload: JobData
    attempts: number
    maxAttempts: number
  }): Promise<void> {
    const { pageId, dateRange, platform } = job.payload
    
    try {
      // Import here to avoid circular dependencies
      const { fetchPostsForPage } = await import('./workers/fetch-posts')
      await fetchPostsForPage(pageId!, dateRange, platform)
    } catch (error) {
      const err = error as Error
      err.message = `Failed to fetch posts: ${err.message}`
      ;(err as Error & { jobId: string }).jobId = job.id
      throw err
    }
  }

  private async processFetchCommentsJob(job: {
    id: string
    type: JobType
    payload: JobData
    attempts: number
    maxAttempts: number
  }): Promise<void> {
    const { postId, platform } = job.payload
    
    try {
      const { fetchCommentsForPost } = await import('./workers/fetch-comments')
      await fetchCommentsForPost(postId!, platform)
    } catch (error) {
      const err = error as Error
      err.message = `Failed to fetch comments: ${err.message}`
      ;(err as Error & { jobId: string }).jobId = job.id
      throw err
    }
  }

  private async processAnalyzeSentimentJob(job: {
    id: string
    type: JobType
    payload: JobData
    attempts: number
    maxAttempts: number
  }): Promise<void> {
    const { commentId } = job.payload
    
    try {
      const { analyzeSentiment } = await import('./workers/analyze-sentiment')
      await analyzeSentiment(commentId!)
    } catch (error) {
      const err = error as Error
      err.message = `Failed to analyze sentiment: ${err.message}`
      ;(err as Error & { jobId: string }).jobId = job.id
      throw err
    }
  }

  private async processRefreshTokensJob(job: {
    id: string
    type: JobType
    payload: JobData
    attempts: number
    maxAttempts: number
  }): Promise<void> {
    try {
      const { refreshExpiredTokens } = await import('./workers/refresh-tokens')
      await refreshExpiredTokens()
    } catch (error) {
      const err = error as Error
      err.message = `Failed to refresh tokens: ${err.message}`
      ;(err as Error & { jobId: string }).jobId = job.id
      throw err
    }
  }

  private async processCleanupDataJob(job: {
    id: string
    type: JobType
    payload: JobData
    attempts: number
    maxAttempts: number
  }): Promise<void> {
    const { userId } = job.payload
    
    try {
      const { cleanupUserData } = await import('./workers/cleanup-data')
      await cleanupUserData(userId)
    } catch (error) {
      const err = error as Error
      err.message = `Failed to cleanup data: ${err.message}`
      ;(err as Error & { jobId: string }).jobId = job.id
      throw err
    }
  }

  // Queue statistics
  async getQueueStats(): Promise<{
    queued: number
    running: number
    completed: number
    failed: number
  }> {
    const [queued, running, completed, failed] = await Promise.all([
      prisma.job.count({ where: { status: JobStatus.QUEUED } }),
      prisma.job.count({ where: { status: JobStatus.RUNNING } }),
      prisma.job.count({ where: { status: JobStatus.COMPLETED } }),
      prisma.job.count({ where: { status: JobStatus.FAILED } })
    ])

    return { queued, running, completed, failed }
  }

  // Clean up old completed jobs
  async cleanupOldJobs(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await prisma.job.deleteMany({
      where: {
        status: JobStatus.COMPLETED,
        completedAt: {
          lt: cutoffDate
        }
      }
    })

    return result.count
  }
}

