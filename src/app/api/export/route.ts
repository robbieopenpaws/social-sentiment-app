// src/app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient, Sentiment } from '@prisma/client'

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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const dataType = searchParams.get('dataType') || 'comments'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const pageId = searchParams.get('pageId')
    const sentiment = searchParams.get('sentiment')
    const fields = searchParams.get('fields')?.split(',') || []

    // Build where clause
    const whereClause: {
      post: {
        page: {
          ownerUserId: string
        }
        pageId?: string
      }
      createdTime?: {
        gte?: Date
        lte?: Date
      }
      analysis?: {
        some: {
          sentimentLabel: Sentiment
        }
      }
    } = {
      post: {
        page: {
          ownerUserId: user.id
        }
      }
    }

    if (dateFrom || dateTo) {
      whereClause.createdTime = {}
      if (dateFrom) whereClause.createdTime.gte = new Date(dateFrom)
      if (dateTo) whereClause.createdTime.lte = new Date(dateTo)
    }

    if (pageId) {
      whereClause.post.pageId = pageId
    }

    if (sentiment) {
      whereClause.analysis = {
        some: {
          sentimentLabel: sentiment as Sentiment
        }
      }
    }

    // Fetch data based on type
    let data: unknown[] = []

    if (dataType === 'comments') {
      data = await prisma.comment.findMany({
        where: whereClause,
        include: {
          post: {
            include: {
              page: true
            }
          },
          analysis: true
        },
        orderBy: {
          createdTime: 'desc'
        },
        take: 10000 // Limit to prevent memory issues
      })
    } else if (dataType === 'analysis') {
      data = await prisma.analysis.findMany({
        where: {
          comment: whereClause
        },
        include: {
          comment: {
            include: {
              post: {
                include: {
                  page: true
                }
              }
            }
          }
        },
        orderBy: {
          analyzedAt: 'desc'
        },
        take: 10000
      })
    } else if (dataType === 'aggregated') {
      // Get aggregated data by post
      const posts = await prisma.post.findMany({
        where: {
          page: {
            ownerUserId: user.id
          },
          ...(pageId && { pageId }),
          ...(dateFrom || dateTo ? {
            createdTime: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo) })
            }
          } : {})
        },
        include: {
          page: true,
          comments: {
            include: {
              analysis: true
            }
          }
        }
      })

      data = posts.map(post => {
        const comments = post.comments
        const analyses = comments.flatMap(c => c.analysis)
        
        const sentimentCounts = {
          positive: analyses.filter(a => a.sentimentLabel === 'POSITIVE').length,
          negative: analyses.filter(a => a.sentimentLabel === 'NEGATIVE').length,
          neutral: analyses.filter(a => a.sentimentLabel === 'NEUTRAL').length
        }

        const avgSentimentScore = analyses.length > 0 
          ? analyses.reduce((sum, a) => sum + a.sentimentScore, 0) / analyses.length 
          : 0

        const avgToxicityScore = analyses.length > 0
          ? analyses.reduce((sum, a) => sum + a.toxicityScore, 0) / analyses.length
          : 0

        return {
          postId: post.externalId,
          pageName: post.page.name,
          platform: post.platform,
          postContent: post.message || post.caption || '',
          createdTime: post.createdTime,
          totalComments: comments.length,
          totalLikes: post.likeCount,
          ...sentimentCounts,
          avgSentimentScore,
          avgToxicityScore
        }
      })
    }

    // Generate export based on format
    if (format === 'csv') {
      const csv = generateCSV(data, dataType, fields)
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="export-${dataType}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    } else if (format === 'json') {
      const json = JSON.stringify(data, null, 2)
      
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="export-${dataType}-${new Date().toISOString().split('T')[0]}.json"`
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Unsupported format' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateCSV(data: unknown[], dataType: string, fields: string[]): string {
  if (data.length === 0) {
    return 'No data available'
  }

  let headers: string[] = []
  let rows: string[][] = []

  if (dataType === 'comments') {
    // Define available headers for comments
    const availableHeaders = {
      commentId: 'Comment ID',
      authorName: 'Author Name',
      authorUsername: 'Author Username',
      message: 'Comment Text',
      sentiment: 'Sentiment',
      sentimentScore: 'Sentiment Score',
      toxicityScore: 'Toxicity Score',
      keywords: 'Keywords',
      platform: 'Platform',
      createdTime: 'Created Time',
      likeCount: 'Like Count',
      pageName: 'Page Name',
      postContent: 'Post Content'
    }

    // Use specified fields or all available
    const selectedFields = fields.length > 0 ? fields : Object.keys(availableHeaders)
    headers = selectedFields.map(field => availableHeaders[field as keyof typeof availableHeaders] || field)

    rows = data.map(comment => {
      const analysis = (comment as any).analysis?.[0]
      return selectedFields.map(field => {
        switch (field) {
          case 'commentId':
            return (comment as any).externalId || ''
          case 'authorName':
            return (comment as any).authorName || ''
          case 'authorUsername':
            return (comment as any).authorUsername || ''
          case 'message':
            return `"${((comment as any).message || '').replace(/"/g, '""')}"`
          case 'sentiment':
            return analysis?.sentimentLabel || ''
          case 'sentimentScore':
            return analysis?.sentimentScore?.toFixed(3) || ''
          case 'toxicityScore':
            return analysis?.toxicityScore?.toFixed(3) || ''
          case 'keywords':
            return analysis?.keywords ? `"${analysis.keywords.join(', ')}"` : ''
          case 'platform':
            return (comment as any).platform || ''
          case 'createdTime':
            return (comment as any).createdTime ? new Date((comment as any).createdTime).toISOString() : ''
          case 'likeCount':
            return (comment as any).likeCount?.toString() || '0'
          case 'pageName':
            return (comment as any).post?.page?.name || ''
          case 'postContent':
            return `"${((comment as any).post?.message || (comment as any).post?.caption || '').replace(/"/g, '""')}"`
          default:
            return ''
        }
      })
    })
  } else if (dataType === 'analysis') {
    headers = [
      'Comment ID',
      'Sentiment',
      'Sentiment Score',
      'Toxicity Score',
      'Language',
      'Keywords',
      'Model Name',
      'Analyzed At',
      'Platform',
      'Page Name'
    ]

    rows = data.map(analysis => [
      (analysis as any).comment?.externalId || '',
      (analysis as any).sentimentLabel || '',
      (analysis as any).sentimentScore?.toFixed(3) || '',
      (analysis as any).toxicityScore?.toFixed(3) || '',
      (analysis as any).language || '',
      (analysis as any).keywords ? `"${(analysis as any).keywords.join(', ')}"` : '',
      (analysis as any).modelName || '',
      (analysis as any).analyzedAt ? new Date((analysis as any).analyzedAt).toISOString() : '',
      (analysis as any).comment?.platform || '',
      (analysis as any).comment?.post?.page?.name || ''
    ])
  } else if (dataType === 'aggregated') {
    headers = [
      'Post ID',
      'Page Name',
      'Platform',
      'Post Content',
      'Created Time',
      'Total Comments',
      'Total Likes',
      'Positive Comments',
      'Negative Comments',
      'Neutral Comments',
      'Avg Sentiment Score',
      'Avg Toxicity Score'
    ]

    rows = data.map(post => [
      (post as any).postId || '',
      (post as any).pageName || '',
      (post as any).platform || '',
      `"${((post as any).postContent || '').replace(/"/g, '""')}"`,
      (post as any).createdTime ? new Date((post as any).createdTime).toISOString() : '',
      (post as any).totalComments?.toString() || '0',
      (post as any).totalLikes?.toString() || '0',
      (post as any).positive?.toString() || '0',
      (post as any).negative?.toString() || '0',
      (post as any).neutral?.toString() || '0',
      (post as any).avgSentimentScore?.toFixed(3) || '0',
      (post as any).avgToxicityScore?.toFixed(3) || '0'
    ])
  }

  // Generate CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

