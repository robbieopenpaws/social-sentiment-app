import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
    try {
          const session = await auth()

      if (!session) {
              return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      // Get access token from session
      const accessToken = (session as any).accessToken

      if (!accessToken) {
              return NextResponse.json({ error: 'No access token found' }, { status: 401 })
      }

      // Get pageId from query parameters
      const { searchParams } = new URL(request.url)
          const pageId = searchParams.get('pageId')

      if (!pageId) {
              return NextResponse.json({ error: 'Page ID is required' }, { status: 400 })
      }

      // Fetch posts from Facebook API
      const response = await fetch(
              `https://graph.facebook.com/v18.0/${pageId}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares&access_token=${accessToken}`
            )

      if (!response.ok) {
              const errorData = await response.json()
              return NextResponse.json({
                        error: 'Failed to fetch posts from Facebook',
                        details: errorData
              }, { status: response.status })
      }

      const data = await response.json()

      return NextResponse.json(data)
    } catch (error) {
          console.error('Error fetching Facebook posts:', error)
          return NextResponse.json({
                  error: 'Internal server error',
                  details: error instanceof Error ? error.message : 'Unknown error'
          }, { status: 500 })
    }
}
