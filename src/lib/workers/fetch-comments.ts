// src/lib/workers/fetch-comments.ts
import { PrismaClient, Platform, JobType } from '@prisma/client'
import { MetaGraphAPI, TokenEncryption } from '../meta'
import { JobQueue } from '../queue'

const prisma = new PrismaClient()

interface CommentData {
  postId: string
  platform: Platform
  externalId: string
  parentExternalId: string | null
  authorId: string | null
  authorName: string | null
  authorUsername: string | null
  message: string
  createdTime: Date
  likeCount: number
  replyCount: number
}

export async function fetchCommentsForPost(
  postId: string
): Promise<void> {
  try {
    // Get post details with page information
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { page: true }
    })

    if (!post) {
      throw new Error(`Post not found: ${postId}`)
    }

    // Decrypt page access token
    const pageToken = TokenEncryption.decrypt(post.page.pageAccessToken)
    const api = new MetaGraphAPI(pageToken)

    let comments: CommentData[] = []

    if (post.platform === Platform.FACEBOOK) {
      // Fetch Facebook comments
      const fbComments = await api.getPostComments(
        post.externalId,
        pageToken
      )

      comments = fbComments.map(comment => ({
        postId: post.id,
        platform: Platform.FACEBOOK,
        externalId: comment.id,
        parentExternalId: comment.parent?.id || null,
        authorId: comment.from?.id || null,
        authorName: comment.from?.name || null,
        authorUsername: null,
        message: comment.message,
        createdTime: new Date(comment.created_time),
        likeCount: comment.like_count || 0,
        replyCount: 0 // Facebook doesn't provide reply count directly
      }))

    } else if (post.platform === Platform.INSTAGRAM) {
      // Fetch Instagram comments
      const igComments = await api.getInstagramComments(
        post.externalId,
        pageToken
      )

      comments = igComments.map(comment => ({
        postId: post.id,
        platform: Platform.INSTAGRAM,
        externalId: comment.id,
        parentExternalId: null, // Instagram API doesn't provide parent info in basic response
        authorId: null, // Instagram doesn't provide author ID in comments
        authorName: null,
        authorUsername: comment.username,
        message: comment.text,
        createdTime: new Date(comment.timestamp),
        likeCount: comment.like_count || 0,
        replyCount: 0
      }))
    }

    console.log(`Fetched ${comments.length} comments for post ${post.externalId}`)

    // Upsert comments to database and enqueue sentiment analysis
    const queue = JobQueue.getInstance()
    
    for (const commentData of comments) {
      // Upsert comment
      const comment = await prisma.comment.upsert({
        where: {
          externalId_platform: {
            externalId: commentData.externalId,
            platform: commentData.platform
          }
        },
        update: {
          likeCount: commentData.likeCount,
          replyCount: commentData.replyCount,
          fetchedAt: new Date()
        },
        create: {
          ...commentData,
          fetchedAt: new Date()
        }
      })

      // Enqueue sentiment analysis job
      await queue.enqueue(JobType.ANALYZE_SENTIMENT, {
        commentId: comment.id
      })
    }

    // Update post comment count and last fetched timestamp
    await prisma.post.update({
      where: { id: postId },
      data: {
        commentCount: comments.length,
        lastFetchedAt: new Date()
      }
    })

    console.log(`Successfully processed ${comments.length} comments for post ${post.externalId}`)

  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error)
    throw error
  }
}

