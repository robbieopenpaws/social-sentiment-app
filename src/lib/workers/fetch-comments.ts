// src/lib/workers/fetch-comments.ts
import { PrismaClient } from '@prisma/client'
import { createMetaAPI } from '../meta'
import { getJobQueue, JobData } from '../queue'

const prisma = new PrismaClient()
const metaAPI = createMetaAPI()
const jobQueue = getJobQueue()

interface FetchCommentsData extends JobData {
  pageId: string
  postId: string
  platform: string
  batchSize?: number
}

interface FetchCommentsResult {
  commentsProcessed: number
  analysisJobsCreated: number
  errors: string[]
}

export async function fetchComments(data: FetchCommentsData): Promise<FetchCommentsResult> {
  const { pageId, postId, platform, batchSize = 100 } = data
  const result: FetchCommentsResult = {
    commentsProcessed: 0,
    analysisJobsCreated: 0,
    errors: []
  }

  try {
    // Get page information
    const page = await prisma.page.findUnique({
      where: { id: pageId }
    })

    if (!page) {
      throw new Error(`Page ${pageId} not found`)
    }

    // Get post information
    const post = await prisma.post.findFirst({
      where: { 
        postId: postId,
        pageId: pageId
      }
    })

    if (!post) {
      throw new Error(`Post ${postId} not found for page ${pageId}`)
    }

    // Decrypt access token
    const accessToken = metaAPI.decryptToken(page.accessToken)

    // Fetch comments based on platform
    let comments: Array<{
      id: string
      message?: string
      text?: string
      created_time?: string
      timestamp?: string
      from: { name?: string; username?: string; id: string }
      like_count?: number
    }>

    if (platform === 'FACEBOOK') {
      comments = await metaAPI.getPostComments(accessToken, postId, batchSize)
    } else if (platform === 'INSTAGRAM') {
      comments = await metaAPI.getInstagramComments(accessToken, postId, batchSize)
    } else {
      throw new Error(`Unsupported platform: ${platform}`)
    }

    // Process each comment
    for (const comment of comments) {
      try {
        const commentText = comment.message || comment.text || ''
        const authorName = comment.from.name || comment.from.username || 'Unknown'
        const createdTime = comment.created_time || comment.timestamp

        if (!commentText.trim()) {
          continue // Skip empty comments
        }

        // Check if comment already exists
        const existingComment = await prisma.comment.findUnique({
          where: { commentId: comment.id }
        })

        let commentRecord

        if (existingComment) {
          // Update existing comment
          commentRecord = await prisma.comment.update({
            where: { id: existingComment.id },
            data: {
              content: commentText,
              authorName: authorName,
              likeCount: comment.like_count || 0
            }
          })
        } else {
          // Create new comment
          commentRecord = await prisma.comment.create({
            data: {
              commentId: comment.id,
              postId: post.id,
              pageId: page.id,
              content: commentText,
              authorName: authorName,
              authorId: comment.from.id,
              platform: platform as 'FACEBOOK' | 'INSTAGRAM',
              createdTime: createdTime ? new Date(createdTime) : new Date(),
              likeCount: comment.like_count || 0
            }
          })
        }

        // Queue sentiment analysis job for this comment
        await jobQueue.addJob('ANALYZE_SENTIMENT', {
          commentId: commentRecord.id,
          pageId: page.id
        }, {
          priority: 'NORMAL',
          delay: 500 // Small delay to avoid overwhelming the analysis system
        })

        result.commentsProcessed++
        result.analysisJobsCreated++

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error processing comment'
        console.error(`Error processing comment ${comment.id}:`, errorMessage)
        result.errors.push(`Comment ${comment.id}: ${errorMessage}`)
      }
    }

    console.log(`Fetch comments completed for post ${postId}: ${result.commentsProcessed} comments processed`)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in fetch comments'
    console.error(`Fetch comments failed for post ${postId}:`, errorMessage)
    result.errors.push(errorMessage)
    throw error
  }

  return result
}

