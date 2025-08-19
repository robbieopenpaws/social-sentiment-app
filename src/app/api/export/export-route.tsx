// src/app/api/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ExportQuery {
  format?: string
  dataType?: string
  dateFrom?: string
  dateTo?: string
  pageId?: string
  sentiment?: string
  platform?: string
  fields?: string
}

interface CommentData {
  id: string
  content: string
  authorName: string
  createdTime: string
  platform: string
  pageName: string
  postId: string
  sentiment?: {
    label: string
    score: number
    toxicity: number
  }
}

interface PageData {
  id: string
  name: string
  platform: string
  isActive: boolean
  lastSync: string
  totalComments: number
  totalPosts: number
}

interface AnalysisData {
  id: string
  commentId: string
  sentimentLabel: string
  sentimentScore: number
  toxicityScore: number
  keywords: string[]
  createdAt: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query: ExportQuery = {
      format: searchParams.get('format') || 'csv',
      dataType: searchParams.get('dataType') || 'comments',
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      pageId: searchParams.get('pageId') || undefined,
      sentiment: searchParams.get('sentiment') || undefined,
      platform: searchParams.get('platform') || undefined,
      fields: searchParams.get('fields') || undefined
    }

    let data: CommentData[] | PageData[] | AnalysisData[]
    let filename: string
    let headers: string[]

    switch (query.dataType) {
      case 'comments':
        const result = await exportComments(session.user.email, query)
        data = result.data
        filename = `comments-export-${new Date().toISOString().split('T')[0]}`
        headers = ['ID', 'Content', 'Author', 'Created', 'Platform', 'Page', 'Post ID', 'Sentiment', 'Score', 'Toxicity']
        break

      case 'pages':
        const pagesResult = await exportPages(session.user.email, query)
        data = pagesResult.data
        filename = `pages-export-${new Date().toISOString().split('T')[0]}`
        headers = ['ID', 'Name', 'Platform', 'Status', 'Last Sync', 'Comments', 'Posts']
        break

      case 'analysis':
        const analysisResult = await exportAnalysis(session.user.email, query)
        data = analysisResult.data
        filename = `analysis-export-${new Date().toISOString().split('T')[0]}`
        headers = ['ID', 'Comment ID', 'Sentiment', 'Score', 'Toxicity', 'Keywords', 'Created']
        break

      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 })
    }

    // Generate export based on format
    switch (query.format) {
      case 'csv':
        const csv = generateCSV(data, headers, query.dataType)
        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}.csv"`
          }
        })

      case 'json':
        return new NextResponse(JSON.stringify(data, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}.json"`
          }
        })

      case 'excel':
        // For Excel, we'll return CSV with Excel-compatible formatting
        const excelCsv = generateCSV(data, headers, query.dataType, true)
        return new NextResponse(excelCsv, {
          headers: {
            'Content-Type': 'application/vnd.ms-excel',
            'Content-Disposition': `attachment; filename="${filename}.csv"`
          }
        })

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

async function exportComments(userEmail: string, query: ExportQuery): Promise<{ data: CommentData[] }> {
  const whereClause: Record<string, unknown> = {
    page: {
      user: {
        email: userEmail
      }
    }
  }

  // Add filters
  if (query.pageId) {
    whereClause.pageId = query.pageId
  }

  if (query.platform) {
    whereClause.page = {
      ...whereClause.page as Record<string, unknown>,
      platform: query.platform
    }
  }

  if (query.dateFrom || query.dateTo) {
    whereClause.createdTime = {}
    if (query.dateFrom) {
      (whereClause.createdTime as Record<string, unknown>).gte = new Date(query.dateFrom)
    }
    if (query.dateTo) {
      (whereClause.createdTime as Record<string, unknown>).lte = new Date(query.dateTo)
    }
  }

  if (query.sentiment) {
    whereClause.analysis = {
      sentimentLabel: query.sentiment
    }
  }

  const comments = await prisma.comment.findMany({
    where: whereClause,
    include: {
      page: true,
      analysis: true
    },
    orderBy: {
      createdTime: 'desc'
    }
  })

  const data: CommentData[] = comments.map(comment => ({
    id: comment.id,
    content: comment.content,
    authorName: comment.authorName,
    createdTime: comment.createdTime.toISOString(),
    platform: comment.page.platform,
    pageName: comment.page.name,
    postId: comment.postId,
    sentiment: comment.analysis ? {
      label: comment.analysis.sentimentLabel,
      score: comment.analysis.sentimentScore,
      toxicity: comment.analysis.toxicityScore
    } : undefined
  }))

  return { data }
}

async function exportPages(userEmail: string, query: ExportQuery): Promise<{ data: PageData[] }> {
  const whereClause: Record<string, unknown> = {
    user: {
      email: userEmail
    }
  }

  if (query.platform) {
    whereClause.platform = query.platform
  }

  const pages = await prisma.page.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          comments: true,
          posts: true
        }
      }
    }
  })

  const data: PageData[] = pages.map(page => ({
    id: page.id,
    name: page.name,
    platform: page.platform,
    isActive: page.isActive,
    lastSync: page.lastSync?.toISOString() || '',
    totalComments: page._count.comments,
    totalPosts: page._count.posts
  }))

  return { data }
}

async function exportAnalysis(userEmail: string, query: ExportQuery): Promise<{ data: AnalysisData[] }> {
  const whereClause: Record<string, unknown> = {
    comment: {
      page: {
        user: {
          email: userEmail
        }
      }
    }
  }

  if (query.sentiment) {
    whereClause.sentimentLabel = query.sentiment
  }

  if (query.dateFrom || query.dateTo) {
    whereClause.createdAt = {}
    if (query.dateFrom) {
      (whereClause.createdAt as Record<string, unknown>).gte = new Date(query.dateFrom)
    }
    if (query.dateTo) {
      (whereClause.createdAt as Record<string, unknown>).lte = new Date(query.dateTo)
    }
  }

  const analyses = await prisma.analysis.findMany({
    where: whereClause,
    orderBy: {
      createdAt: 'desc'
    }
  })

  const data: AnalysisData[] = analyses.map(analysis => ({
    id: analysis.id,
    commentId: analysis.commentId,
    sentimentLabel: analysis.sentimentLabel,
    sentimentScore: analysis.sentimentScore,
    toxicityScore: analysis.toxicityScore,
    keywords: analysis.keywords,
    createdAt: analysis.createdAt.toISOString()
  }))

  return { data }
}

function generateCSV(
  data: CommentData[] | PageData[] | AnalysisData[], 
  headers: string[], 
  dataType: string, 
  excelCompatible = false
): string {
  const separator = excelCompatible ? ';' : ','
  const quote = '"'
  
  // Helper function to escape CSV values
  const escapeCSV = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(separator) || str.includes(quote) || str.includes('\n')) {
      return quote + str.replace(/"/g, '""') + quote
    }
    return str
  }

  // Generate header row
  let csv = headers.map(header => escapeCSV(header)).join(separator) + '\n'

  // Generate data rows
  data.forEach(row => {
    let rowData: string[] = []
    
    switch (dataType) {
      case 'comments':
        const comment = row as CommentData
        rowData = [
          escapeCSV(comment.id),
          escapeCSV(comment.content),
          escapeCSV(comment.authorName),
          escapeCSV(comment.createdTime),
          escapeCSV(comment.platform),
          escapeCSV(comment.pageName),
          escapeCSV(comment.postId),
          escapeCSV(comment.sentiment?.label || ''),
          escapeCSV(comment.sentiment?.score || ''),
          escapeCSV(comment.sentiment?.toxicity || '')
        ]
        break

      case 'pages':
        const page = row as PageData
        rowData = [
          escapeCSV(page.id),
          escapeCSV(page.name),
          escapeCSV(page.platform),
          escapeCSV(page.isActive ? 'Active' : 'Inactive'),
          escapeCSV(page.lastSync),
          escapeCSV(page.totalComments),
          escapeCSV(page.totalPosts)
        ]
        break

      case 'analysis':
        const analysis = row as AnalysisData
        rowData = [
          escapeCSV(analysis.id),
          escapeCSV(analysis.commentId),
          escapeCSV(analysis.sentimentLabel),
          escapeCSV(analysis.sentimentScore),
          escapeCSV(analysis.toxicityScore),
          escapeCSV(analysis.keywords.join('; ')),
          escapeCSV(analysis.createdAt)
        ]
        break
    }

    csv += rowData.join(separator) + '\n'
  })

  return csv
}

