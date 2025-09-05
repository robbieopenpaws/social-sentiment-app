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

    // Fetch pages from Facebook API
    const response = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
    )
    
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ 
        error: 'Failed to fetch pages from Facebook',
        details: errorData 
      }, { status: response.status })
    }

    const data = await response.json()
    
    // If no pages found, try alternative approach
    if (!data.data || data.data.length === 0) {
      // Try to get basic page info for known pages
      const knownPageIds = ['554024238384285'] // Your Generation Vegan page
      const pages = []
      
      for (const pageId of knownPageIds) {
        try {
          const pageResponse = await fetch(
            `https://graph.facebook.com/${pageId}?fields=id,name,category&access_token=${accessToken}`
          )
          
          if (pageResponse.ok) {
            const pageData = await pageResponse.json()
            pages.push({
              id: pageData.id,
              name: pageData.name,
              category: pageData.category,
              access_token: accessToken // Use user token for now
            })
          }
        } catch (error) {
          console.error(`Error fetching page ${pageId}:`, error)
        }
      }
      
      return NextResponse.json({ 
        pages: pages,
        message: pages.length > 0 ? 'Found pages using alternative method' : 'No pages found'
      })
    }

    return NextResponse.json({ 
      pages: data.data,
      message: 'Pages loaded successfully'
    })

  } catch (error) {
    console.error('Error in pages API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
