// src/app/api/facebook-posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

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

    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')
    const pageAccessToken = searchParams.get('pageAccessToken')

    if (!pageId || !pageAccessToken) {
      return NextResponse.json(
        { error: 'Missing pageId or pageAccessToken' },
        { status: 400 }
      )
    }

    // Fetch posts from the Facebook page
    const postsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true)&access_token=${pageAccessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!postsResponse.ok) {
      const errorData = await postsResponse.json()
      console.error('Facebook API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to fetch Facebook posts', details: errorData },
        { status: postsResponse.status }
      )
    }

    const postsData = await postsResponse.json()
    
    return NextResponse.json({ posts: postsData.data })

  } catch (error) {
    console.error('Error fetching Facebook posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const { postId, pageAccessToken } = body

    if (!postId || !pageAccessToken) {
      return NextResponse.json(
        { error: 'Missing postId or pageAccessToken' },
        { status: 400 }
      )
    }

    // Fetch comments for a specific post
    const commentsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${postId}/comments?fields=id,message,created_time,from,like_count&access_token=${pageAccessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!commentsResponse.ok) {
      const errorData = await commentsResponse.json()
      console.error('Facebook API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to fetch Facebook comments', details: errorData },
        { status: commentsResponse.status }
      )
    }

    const commentsData = await commentsResponse.json()
    
    return NextResponse.json({ comments: commentsData.data })

  } catch (error) {
    console.error('Error fetching Facebook comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

