// src/app/api/facebook-pages/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized or no access token' },
        { status: 401 }
      )
    }

    // Fetch user's Facebook pages
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${session.accessToken}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Facebook API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to fetch Facebook pages', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Transform the data to include page access tokens
    const pages = data.data.map((page: any) => ({
      id: page.id,
      name: page.name,
      category: page.category,
      access_token: page.access_token,
      tasks: page.tasks || []
    }))

    return NextResponse.json({ pages })

  } catch (error) {
    console.error('Error fetching Facebook pages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

