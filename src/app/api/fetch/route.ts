// src/app/api/fetch/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient, JobType } from '@prisma/client'
import { JobQueue } from '@/lib/queue'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { pageIds, dateRange, platforms } = body

    // Validate input
    if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
      return NextResponse.json(
        { error: 'Page IDs are required' },
        { status: 400 }
      )
    }

    if (!dateRange || !dateRange.since || !dateRange.until) {
      return NextResponse.json(
        { error: 'Date range is required' },
        { status: 400 }
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

    // Verify user owns the pages
    const userPages = await prisma.page.findMany({
      where: {
        id: { in: pageIds },
        ownerUserId: user.id,
        isActive: true
      }
    })

    if (userPages.length !== pageIds.length) {
      return NextResponse.json(
        { error: 'Some pages not found or not owned by user' },
        { status: 403 }
      )
    }

    // Enqueue fetch jobs for each page
    const queue = JobQueue.getInstance()
    const jobIds: string[] = []

    for (const page of userPages) {
      // Skip if platform filter is specified and doesn't match
      if (platforms && !platforms.includes(page.platform)) {
        continue
      }

      // Enqueue fetch posts job
      const jobId = await queue.enqueue(JobType.FETCH_POSTS, {
        pageId: page.id,
        dateRange,
        platform: page.platform,
        userId: user.id
      })

      jobIds.push(jobId)
    }

    // Start processing if not already running
    queue.startProcessing()

    return NextResponse.json({
      message: 'Fetch jobs enqueued successfully',
      jobIds,
      totalJobs: jobIds.length
    })

  } catch (error) {
    console.error('Error enqueueing fetch jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // Get queue statistics
    const queue = JobQueue.getInstance()
    const stats = await queue.getQueueStats()

    return NextResponse.json({
      queueStats: stats,
      isProcessing: true // You might want to track this state
    })

  } catch (error) {
    console.error('Error getting queue stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

