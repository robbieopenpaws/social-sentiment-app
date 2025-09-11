// src/lib/workers/fetch-posts.ts
import { PrismaClient, Platform, JobType } from '@prisma/client'
import { MetaGraphAPI, TokenEncryption } from '../meta'
import { JobQueue } from '../queue'

const prisma = new PrismaClient()

interface PostData {
  pageId: string
  platform: Platform
  externalId: string
  message: string | null
  caption: string | null
  createdTime: Date
  permalinkUrl: string
  likeCount: number
  commentCount: number
}

export async function fetchPostsForPage(
  pageId: string,
  dateRange?: { since: string; until: string }
): Promise<void> {
  try {
    // Get page details
    const page = await prisma.page.findUnique({
      where: { id: pageId }
    })

    if (!page) {
      throw new Error(`Page not found: ${pageId}`)
    }

    // Decrypt page access token
    const pageToken = TokenEncryption.decrypt(page.pageAccessToken)
    const api = new MetaGraphAPI(pageToken)

    // Validate token
    const isValid = await api.validateToken()
    if (!isValid) {
      throw new Error(`Invalid token for page: ${page.name}`)
    }

    let posts: PostData[] = []

    if (page.platform === Platform.FACEBOOK) {
      // Fetch Facebook posts
      const fbPosts = await api.getPagePosts(
        page.externalId,
        pageToken,
        dateRange?.since,
        dateRange?.until
      )

      posts = fbPosts.map(post => ({
        pageId: page.id,
        platform: Platform.FACEBOOK,
        externalId: post.id,
        message: post.message,
        caption: null,
        createdTime: new Date(post.created_time),
        permalinkUrl: post.permalink_url,
        likeCount: post.likes?.summary?.total_count || 0,
        commentCount: post.comments?.summary?.total_count || 0
      }))

    } else if (page.platform === Platform.INSTAGRAM) {
      // Check if we have Instagram access
      const igAccount = await api.getConnectedInstagramAccount(page.externalId, pageToken)
      if (!igAccount) {
        throw new Error(`No Instagram account connected to page: ${page.name}`)
      }

      // Fetch Instagram posts
      const igPosts = await api.getInstagramPosts(
        igAccount.id,
        pageToken,
        dateRange?.since,
        dateRange?.until
      )

      posts = igPosts.map(post => ({
        pageId: page.id,
        platform: Platform.INSTAGRAM,
        externalId: post.id,
        message: null,
        caption: post.caption,
        createdTime: new Date(post.timestamp),
        permalinkUrl: post.permalink,
        likeCount: post.like_count || 0,
        commentCount: post.comments_count || 0
      }))
    }

    console.log(`Fetched ${posts.length} posts for page ${page.name}`)

    // Upsert posts to database
    const queue = JobQueue.getInstance()
    
    for (const postData of posts) {
      // Upsert post
      const post = await prisma.post.upsert({
        where: {
          externalId_platform: {
            externalId: postData.externalId,
            platform: postData.platform
          }
        },
        update: {
          likeCount: postData.likeCount,
          commentCount: postData.commentCount,
          lastFetchedAt: new Date()
        },
        create: {
          ...postData,
          fetchedAt: new Date()
        }
      })

      // Enqueue comment fetching job if post has comments
      if (postData.commentCount > 0) {
        await queue.enqueue(JobType.FETCH_COMMENTS, {
          postId: post.id,
          platform: postData.platform
        })
      }
    }

    // Update page last fetched timestamp
    await prisma.page.update({
      where: { id: pageId },
      data: { updatedAt: new Date() }
    })

    console.log(`Successfully processed ${posts.length} posts for page ${page.name}`)

  } catch (error) {
    console.error(`Error fetching posts for page ${pageId}:`, error)
    throw error
  }
}

