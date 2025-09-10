// src/app/api/export/route.ts
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
    const whereClause: any = {
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
          sentimentLabel: sentiment
        }
      }
    }

    // Fetch data based on type
    let data: any[] = []

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

function generateCSV(data: any[], dataType: string, fields: string[]): string {
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
      const analysis = comment.analysis?.[0]
      return selectedFields.map(field => {
        switch (field) {
          case 'commentId':
            return comment.externalId || ''
          case 'authorName':
            return comment.authorName || ''
          case 'authorUsername':
            return comment.authorUsername || ''
          case 'message':
            return `"${(comment.message || '').replace(/"/g, '""')}"`
          case 'sentiment':
            return analysis?.sentimentLabel || ''
          case 'sentimentScore':
            return analysis?.sentimentScore?.toFixed(3) || ''
          case 'toxicityScore':
            return analysis?.toxicityScore?.toFixed(3) || ''
          case 'keywords':
            return analysis?.keywords ? `"${analysis.keywords.join(', ')}"` : ''
          case 'platform':
            return comment.platform || ''
          case 'createdTime':
            return comment.createdTime ? new Date(comment.createdTime).toISOString() : ''
          case 'likeCount':
            return comment.likeCount?.toString() || '0'
          case 'pageName':
            return comment.post?.page?.name || ''
          case 'postContent':
            return `"${(comment.post?.message || comment.post?.caption || '').replace(/"/g, '""')}"`
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
      analysis.comment?.externalId || '',
      analysis.sentimentLabel || '',
      analysis.sentimentScore?.toFixed(3) || '',
      analysis.toxicityScore?.toFixed(3) || '',
      analysis.language || '',
      analysis.keywords ? `"${analysis.keywords.join(', ')}"` : '',
      analysis.modelName || '',
      analysis.analyzedAt ? new Date(analysis.analyzedAt).toISOString() : '',
      analysis.comment?.platform || '',
      analysis.comment?.post?.page?.name || ''
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
      post.postId || '',
      post.pageName || '',
      post.platform || '',
      `"${(post.postContent || '').replace(/"/g, '""')}"`,
      post.createdTime ? new Date(post.createdTime).toISOString() : '',
      post.totalComments?.toString() || '0',
      post.totalLikes?.toString() || '0',
      post.positive?.toString() || '0',
      post.negative?.toString() || '0',
      post.neutral?.toString() || '0',
      post.avgSentimentScore?.toFixed(3) || '0',
      post.avgToxicityScore?.toFixed(3) || '0'
    ])
  }

  // Generate CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

