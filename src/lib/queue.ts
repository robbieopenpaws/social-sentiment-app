// src/lib/queue.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type JobType = 'FETCH_POSTS' | 'FETCH_COMMENTS' | 'ANALYZE_SENTIMENT' | 'REFRESH_TOKENS' | 'CLEANUP_DATA'
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
export type JobPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface JobData {
  pageId?: string
  postId?: string
  commentId?: string
  userId?: string
  batchSize?: number
  retryCount?: number
  [key: string]: unknown
}

export interface Job {
  id: string
  type: JobType
  status: JobStatus
  priority: JobPriority
  data: JobData
  result?: Record<string, unknown>
  error?: string
  attempts: number
  maxAttempts: number
  createdAt: Date
  updatedAt: Date
  scheduledFor?: Date
  startedAt?: Date
  completedAt?: Date
}

export interface JobOptions {
  priority?: JobPriority
  maxAttempts?: number
  delay?: number
  retryDelay?: number
}

export interface QueueStats {
  pending: number
  processing: number
  completed: number
  failed: number
  total: number
}

export class JobQueue {
  private isProcessing = false
  private processingInterval: NodeJS.Timeout | null = null
  private readonly defaultOptions: Required<JobOptions> = {
    priority: 'NORMAL',
    maxAttempts: 3,
    delay: 0,
    retryDelay: 5000
  }

  // Add a job to the queue
  async addJob(type: JobType, data: JobData, options: JobOptions = {}): Promise<string> {
    const jobOptions = { ...this.defaultOptions, ...options }
    const scheduledFor = jobOptions.delay > 0 
      ? new Date(Date.now() + jobOptions.delay)
      : new Date()

    try {
      const job = await prisma.job.create({
        data: {
          type,
          status: 'PENDING',
          priority: jobOptions.priority,
          data: data as Record<string, unknown>,
          attempts: 0,
          maxAttempts: jobOptions.maxAttempts,
          scheduledFor
        }
      })

      console.log(`Job ${job.id} added to queue: ${type}`)
      return job.id
    } catch (error) {
      console.error('Failed to add job to queue:', error)
      throw new Error('Failed to add job to queue')
    }
  }

  // Get the next job to process
  async getNextJob(): Promise<Job | null> {
    try {
      // Get the highest priority job that's ready to run
      const job = await prisma.job.findFirst({
        where: {
          status: 'PENDING',
          scheduledFor: {
            lte: new Date()
          },
          attempts: {
            lt: prisma.job.fields.maxAttempts
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ]
      })

      return job as Job | null
    } catch (error) {
      console.error('Failed to get next job:', error)
      return null
    }
  }

  // Mark job as processing
  async startJob(jobId: string): Promise<boolean> {
    try {
      const result = await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
          attempts: {
            increment: 1
          }
        }
      })

      return !!result
    } catch (error) {
      console.error('Failed to start job:', error)
      return false
    }
  }

  // Mark job as completed
  async completeJob(jobId: string, result?: Record<string, unknown>): Promise<boolean> {
    try {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          result: result || {},
          completedAt: new Date()
        }
      })

      console.log(`Job ${jobId} completed successfully`)
      return true
    } catch (error) {
      console.error('Failed to complete job:', error)
      return false
    }
  }

  // Mark job as failed
  async failJob(jobId: string, error: string, shouldRetry = true): Promise<boolean> {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId }
      })

      if (!job) {
        console.error(`Job ${jobId} not found`)
        return false
      }

      const canRetry = shouldRetry && job.attempts < job.maxAttempts
      const newStatus: JobStatus = canRetry ? 'RETRYING' : 'FAILED'
      const scheduledFor = canRetry 
        ? new Date(Date.now() + this.defaultOptions.retryDelay)
        : undefined

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          error,
          scheduledFor,
          completedAt: canRetry ? undefined : new Date()
        }
      })

      if (canRetry) {
        console.log(`Job ${jobId} scheduled for retry (attempt ${job.attempts + 1}/${job.maxAttempts})`)
      } else {
        console.log(`Job ${jobId} failed permanently after ${job.attempts} attempts`)
      }

      return true
    } catch (error) {
      console.error('Failed to fail job:', error)
      return false
    }
  }

  // Process a single job
  async processJob(job: Job): Promise<void> {
    console.log(`Processing job ${job.id}: ${job.type}`)

    if (!await this.startJob(job.id)) {
      console.error(`Failed to start job ${job.id}`)
      return
    }

    try {
      let result: Record<string, unknown> = {}

      switch (job.type) {
        case 'FETCH_POSTS':
          result = await this.processFetchPosts(job.data)
          break

        case 'FETCH_COMMENTS':
          result = await this.processFetchComments(job.data)
          break

        case 'ANALYZE_SENTIMENT':
          result = await this.processAnalyzeSentiment(job.data)
          break

        case 'REFRESH_TOKENS':
          result = await this.processRefreshTokens(job.data)
          break

        case 'CLEANUP_DATA':
          result = await this.processCleanupData(job.data)
          break

        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      await this.completeJob(job.id, result)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`Job ${job.id} failed:`, errorMessage)
      await this.failJob(job.id, errorMessage)
    }
  }

  // Job processors
  private async processFetchPosts(data: JobData): Promise<Record<string, unknown>> {
    const { fetchPosts } = await import('./workers/fetch-posts')
    return await fetchPosts(data)
  }

  private async processFetchComments(data: JobData): Promise<Record<string, unknown>> {
    const { fetchComments } = await import('./workers/fetch-comments')
    return await fetchComments(data)
  }

  private async processAnalyzeSentiment(data: JobData): Promise<Record<string, unknown>> {
    const { analyzeSentiment } = await import('./workers/analyze-sentiment')
    return await analyzeSentiment(data)
  }

  private async processRefreshTokens(data: JobData): Promise<Record<string, unknown>> {
    const { refreshTokens } = await import('./workers/refresh-tokens')
    return await refreshTokens(data)
  }

  private async processCleanupData(data: JobData): Promise<Record<string, unknown>> {
    const { cleanupData } = await import('./workers/cleanup-data')
    return await cleanupData(data)
  }

  // Start processing jobs
  startProcessing(intervalMs = 5000): void {
    if (this.isProcessing) {
      console.log('Job processing already started')
      return
    }

    this.isProcessing = true
    console.log('Starting job queue processing...')

    this.processingInterval = setInterval(async () => {
      try {
        const job = await this.getNextJob()
        if (job) {
          await this.processJob(job)
        }
      } catch (error) {
        console.error('Error in job processing loop:', error)
      }
    }, intervalMs)
  }

  // Stop processing jobs
  stopProcessing(): void {
    if (!this.isProcessing) {
      console.log('Job processing not running')
      return
    }

    this.isProcessing = false
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    console.log('Job queue processing stopped')
  }

  // Get queue statistics
  async getStats(): Promise<QueueStats> {
    try {
      const [pending, processing, completed, failed, total] = await Promise.all([
        prisma.job.count({ where: { status: 'PENDING' } }),
        prisma.job.count({ where: { status: 'PROCESSING' } }),
        prisma.job.count({ where: { status: 'COMPLETED' } }),
        prisma.job.count({ where: { status: 'FAILED' } }),
        prisma.job.count()
      ])

      return { pending, processing, completed, failed, total }
    } catch (error) {
      console.error('Failed to get queue stats:', error)
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
    }
  }

  // Get jobs by status
  async getJobs(status?: JobStatus, limit = 50): Promise<Job[]> {
    try {
      const jobs = await prisma.job.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return jobs as Job[]
    } catch (error) {
      console.error('Failed to get jobs:', error)
      return []
    }
  }

  // Cancel a job
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId }
      })

      if (!job) {
        return false
      }

      if (job.status === 'PROCESSING') {
        console.log(`Cannot cancel job ${jobId}: currently processing`)
        return false
      }

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: 'Cancelled by user',
          completedAt: new Date()
        }
      })

      console.log(`Job ${jobId} cancelled`)
      return true
    } catch (error) {
      console.error('Failed to cancel job:', error)
      return false
    }
  }

  // Cleanup old completed jobs
  async cleanupOldJobs(olderThanDays = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const result = await prisma.job.deleteMany({
        where: {
          status: {
            in: ['COMPLETED', 'FAILED']
          },
          completedAt: {
            lt: cutoffDate
          }
        }
      })

      console.log(`Cleaned up ${result.count} old jobs`)
      return result.count
    } catch (error) {
      console.error('Failed to cleanup old jobs:', error)
      return 0
    }
  }
}

// Singleton instance
let queueInstance: JobQueue | null = null

export function getJobQueue(): JobQueue {
  if (!queueInstance) {
    queueInstance = new JobQueue()
  }
  return queueInstance
}

