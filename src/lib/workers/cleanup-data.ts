// src/lib/workers/cleanup-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanupUserData(userId?: string): Promise<void> {
  try {
    console.log('Starting data cleanup process')

    if (userId) {
      // Clean up specific user's data
      await cleanupSpecificUser(userId)
    } else {
      // Clean up all users based on their retention settings
      await cleanupAllUsers()
    }

    console.log('Data cleanup completed')

  } catch (error) {
    console.error('Error in data cleanup process:', error)
    throw error
  }
}

async function cleanupSpecificUser(userId: string): Promise<void> {
  console.log(`Cleaning up data for user ${userId}`)

  // Get user's retention settings
  const retentionSettings = await prisma.dataRetention.findUnique({
    where: { userId }
  })

  if (!retentionSettings) {
    console.log(`No retention settings found for user ${userId}`)
    return
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionSettings.retentionDays)

  // Get user's pages
  const userPages = await prisma.page.findMany({
    where: { ownerUserId: userId }
  })

  const pageIds = userPages.map(p => p.id)

  if (pageIds.length === 0) {
    console.log(`No pages found for user ${userId}`)
    return
  }

  // Delete old analyses
  const deletedAnalyses = await prisma.analysis.deleteMany({
    where: {
      analyzedAt: { lt: cutoffDate },
      comment: {
        post: {
          pageId: { in: pageIds }
        }
      }
    }
  })

  // Delete old comments
  const deletedComments = await prisma.comment.deleteMany({
    where: {
      fetchedAt: { lt: cutoffDate },
      post: {
        pageId: { in: pageIds }
      }
    }
  })

  // Delete old posts
  const deletedPosts = await prisma.post.deleteMany({
    where: {
      fetchedAt: { lt: cutoffDate },
      pageId: { in: pageIds }
    }
  })

  // Update last cleanup timestamp
  await prisma.dataRetention.update({
    where: { userId },
    data: { lastCleanupAt: new Date() }
  })

  // Log audit entry
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DATA_CLEANUP',
      resource: 'USER_DATA',
      details: {
        deletedAnalyses: deletedAnalyses.count,
        deletedComments: deletedComments.count,
        deletedPosts: deletedPosts.count,
        cutoffDate: cutoffDate.toISOString()
      }
    }
  })

  console.log(`Cleaned up data for user ${userId}: ${deletedPosts.count} posts, ${deletedComments.count} comments, ${deletedAnalyses.count} analyses`)
}

async function cleanupAllUsers(): Promise<void> {
  console.log('Cleaning up data for all users with auto-delete enabled')

  // Get all users with auto-delete enabled
  const retentionSettings = await prisma.dataRetention.findMany({
    where: { autoDelete: true }
  })

  for (const settings of retentionSettings) {
    try {
      await cleanupSpecificUser(settings.userId)
    } catch (error) {
      console.error(`Error cleaning up data for user ${settings.userId}:`, error)
    }
  }

  // Also clean up orphaned data (comments/posts without valid pages)
  await cleanupOrphanedData()
}

async function cleanupOrphanedData(): Promise<void> {
  console.log('Cleaning up orphaned data')

  // Delete analyses for comments that no longer exist
  const orphanedAnalyses = await prisma.analysis.deleteMany({
    where: {
      comment: null
    }
  })

  // Delete comments for posts that no longer exist
  const orphanedComments = await prisma.comment.deleteMany({
    where: {
      post: null
    }
  })

  // Delete posts for pages that no longer exist or are inactive
  const orphanedPosts = await prisma.post.deleteMany({
    where: {
      OR: [
        { page: null },
        { page: { isActive: false } }
      ]
    }
  })

  console.log(`Cleaned up orphaned data: ${orphanedPosts.count} posts, ${orphanedComments.count} comments, ${orphanedAnalyses.count} analyses`)
}

// Function to completely delete a user's data (GDPR compliance)
export async function deleteUserData(userId: string): Promise<void> {
  console.log(`Completely deleting all data for user ${userId}`)

  try {
    // Get user's pages
    const userPages = await prisma.page.findMany({
      where: { ownerUserId: userId }
    })

    const pageIds = userPages.map(p => p.id)

    // Delete in correct order due to foreign key constraints
    if (pageIds.length > 0) {
      // Delete analyses
      await prisma.analysis.deleteMany({
        where: {
          comment: {
            post: {
              pageId: { in: pageIds }
            }
          }
        }
      })

      // Delete comments
      await prisma.comment.deleteMany({
        where: {
          post: {
            pageId: { in: pageIds }
          }
        }
      })

      // Delete posts
      await prisma.post.deleteMany({
        where: {
          pageId: { in: pageIds }
        }
      })

      // Delete pages
      await prisma.page.deleteMany({
        where: {
          ownerUserId: userId
        }
      })
    }

    // Delete user's retention settings
    await prisma.dataRetention.deleteMany({
      where: { userId }
    })

    // Delete user's accounts
    await prisma.account.deleteMany({
      where: { userId }
    })

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    })

    // Log audit entry (without userId since user is deleted)
    await prisma.auditLog.create({
      data: {
        action: 'USER_DATA_DELETION',
        resource: 'USER_ACCOUNT',
        details: {
          deletedUserId: userId,
          deletedPages: pageIds.length,
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log(`Successfully deleted all data for user ${userId}`)

  } catch (error) {
    console.error(`Error deleting user data for ${userId}:`, error)
    throw error
  }
}

