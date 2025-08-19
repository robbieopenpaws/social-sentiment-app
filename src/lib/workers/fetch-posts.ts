// src/lib/workers/fetch-posts.ts
import { PrismaClient } from '@prisma/client'
import { createMetaAPI } from '../meta'
import { getJobQueue, JobData } from '../queue'

const prisma = new PrismaClient()
const metaAPI = createMetaAPI()
const jobQueue = getJobQueue()

interface FetchPostsData extends JobData {
  pageId: string
  batchSize?: number
  since?: string
}

interface FetchPostsResult {
  postsProcessed: number
  commentsJobsCreated: number
  errors: string[]
}

export async function fetchPosts(data: FetchPostsData): Promise<FetchPostsResult> {
  const { pageId, batchSize = 25, since } = data
  const result: FetchPostsResult = {
    postsProcessed: 0,
    commentsJobsCreated: 0,
    errors: []
  }

  try {
    // Get page information
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: { user: true }
    })

    if (!page) {
      throw new Error(`Page ${pageId} not found`)
    }

    if (!page.isActive) {
      throw new Error(`Page ${pageId} is not active`)
    }

    // Decrypt access token
    const accessToken = metaAPI.decryptToken(page.accessToken)

    // Validate token before proceeding
    const isValidToken = await metaAPI.validateToken(accessToken)
    if (!isValidToken) {
      throw new Error(`Invalid access token for page ${pageId}`)
    }

    // Fetch posts from Facebook/Instagram
    let posts: Array<{ id: string; message?: string; story?: string; created_time: string; updated_time: string }>

    if (page.platform === 'FACEBOOK') {
      posts = await metaAPI.getPagePosts(accessToken, page.pageId, batchSize, since)
    } else if (page.platform === 'INSTAGRAM') {
      // For Instagram, we need to get the Instagram Business Account ID first
      const instagramAccount = await metaAPI.getInstagramAccount(accessToken, page.pageId)
      if (!instagramAccount) {
        throw new Error(`No Instagram Business Account found for page ${pageId}`)
      }

      const media = await metaAPI.getInstagramMedia(accessToken, instagramAccount.id, batchSize)
      posts = media.map(item => ({
        id: item.id,
        message: item.caption,
        created_time: item.timestamp,
        updated_time: item.timestamp
      }))
    } else {
      throw new Error(`Unsupported platform: ${page.platform}`)
    }

    // Process each post
    for (const post of posts) {
      try {
        // Check if post already exists
        const existingPost = await prisma.post.findUnique({
          where: { postId: post.id }
        })

        if (existingPost) {
          // Update existing post
          await prisma.post.update({
            where: { id: existingPost.id },
            data: {
              content: post.message || post.story || '',
              updatedTime: new Date(post.updated_time)
            }
          })
        } else {
          // Create new post
          await prisma.post.create({
            data: {
              postId: post.id,
              pageId: page.id,
              content: post.message || post.story || '',
              platform: page.platform,
              createdTime: new Date(post.created_time),
              updatedTime: new Date(post.updated_time)
            }
          })
        }

        // Queue job to fetch comments for this post
        await jobQueue.addJob('FETCH_COMMENTS', {
          pageId: page.id,
          postId: post.id,
          platform: page.platform
        }, {
          priority: 'NORMAL',
          delay: 1000 // Small delay to avoid rate limiting
        })

        result.postsProcessed++
        result.commentsJobsCreated++

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error processing post'
        console.error(`Error processing post ${post.id}:`, errorMessage)
        result.errors.push(`Post ${post.id}: ${errorMessage}`)
      }
    }

    // Update page last sync time
    await prisma.page.update({
      where: { id: pageId },
      data: { lastSync: new Date() }
    })

    console.log(`Fetch posts completed for page ${pageId}: ${result.postsProcessed} posts processed`)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in fetch posts'
    console.error(`Fetch posts failed for page ${pageId}:`, errorMessage)
    result.errors.push(errorMessage)
    throw error
  }

  return result
}

