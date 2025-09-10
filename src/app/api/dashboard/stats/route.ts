// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's pages
    const pages = await prisma.page.findMany({
      where: { ownerUserId: user.id }
    })

    const pageIds = pages.map(p => p.id)

    // Get statistics
    const [totalPages, totalPosts, totalComments, totalAnalyses] = await Promise.all([
      prisma.page.count({ where: { ownerUserId: user.id } }),
      prisma.post.count({ where: { pageId: { in: pageIds } } }),
      prisma.comment.count({ where: { post: { pageId: { in: pageIds } } } }),
      prisma.analysis.count({ 
        where: { 
          comment: { 
            post: { 
              pageId: { in: pageIds } 
            } 
          } 
        } 
      })
    ])

    // Get sentiment breakdown
    const sentimentBreakdown = await prisma.analysis.groupBy({
      by: ['sentimentLabel'],
      where: {
        comment: {
          post: {
            pageId: { in: pageIds }
          }
        }
      },
      _count: {
        sentimentLabel: true
      }
    })

    const sentimentCounts = {
      positive: sentimentBreakdown.find(s => s.sentimentLabel === 'POSITIVE')?._count.sentimentLabel || 0,
      negative: sentimentBreakdown.find(s => s.sentimentLabel === 'NEGATIVE')?._count.sentimentLabel || 0,
      neutral: sentimentBreakdown.find(s => s.sentimentLabel === 'NEUTRAL')?._count.sentimentLabel || 0
    }

    // Get queue stats
    const queueStats = await Promise.all([
      prisma.job.count({ where: { status: 'QUEUED' } }),
      prisma.job.count({ where: { status: 'RUNNING' } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.count({ where: { status: 'FAILED' } })
    ])

    // Get recent activity (mock for now)
    const recentActivity = [
      {
        id: '1',
        type: 'FETCH',
        message: 'Fetched 25 new comments from Facebook page',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: '2',
        type: 'ANALYSIS',
        message: 'Completed sentiment analysis for 15 comments',
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: '3',
        type: 'EXPORT',
        message: 'Exported 500 comments to CSV',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ]

    return NextResponse.json({
      totalPages,
      totalPosts,
      totalComments,
      totalAnalyses,
      sentimentBreakdown: sentimentCounts,
      recentActivity,
      queueStats: {
        queued: queueStats[0],
        running: queueStats[1],
        completed: queueStats[2],
        failed: queueStats[3]
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

