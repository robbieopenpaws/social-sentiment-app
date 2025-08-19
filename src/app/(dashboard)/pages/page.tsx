'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Settings, 
  Trash2, 
  Facebook, 
  Instagram,
  Users,
  MessageSquare,
  TrendingUp,
  RefreshCw
} from 'lucide-react'

interface ConnectedPage {
  id: string
  pageId: string
  name: string
  platform: 'FACEBOOK' | 'INSTAGRAM'
  isActive: boolean
  lastSync: string
  stats: {
    totalComments: number
    totalPosts: number
    avgSentiment: number
  }
}

export default function PagesPage() {
  const { data: session } = useSession()
  const [pages, setPages] = useState<ConnectedPage[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/pages')
      if (response.ok) {
        const data = await response.json()
        setPages(data)
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectPages = async () => {
    setConnecting(true)
    try {
      // This would trigger the Facebook OAuth flow
      // For now, we'll simulate the connection
      console.log('Connecting to Facebook pages...')
      
      // In a real implementation, this would:
      // 1. Redirect to Facebook OAuth
      // 2. Get user permission for pages
      // 3. Store page tokens
      // 4. Refresh the page list
      
      setTimeout(() => {
        fetchPages()
        setConnecting(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to connect pages:', error)
      setConnecting(false)
    }
  }

  const handleTogglePage = async (pageId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      
      if (response.ok) {
        fetchPages()
      }
    } catch (error) {
      console.error('Failed to toggle page:', error)
    }
  }

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to disconnect this page?')) return
    
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchPages()
      }
    } catch (error) {
      console.error('Failed to delete page:', error)
    }
  }

  const handleSyncPage = async (pageId: string) => {
    try {
      const response = await fetch('/api/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId })
      })
      
      if (response.ok) {
        // Show success message or update UI
        console.log('Sync triggered for page:', pageId)
      }
    } catch (error) {
      console.error('Failed to sync page:', error)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Connected Pages</h1>
          <p className="text-gray-600">
            Manage your Facebook and Instagram pages for sentiment analysis
          </p>
        </div>
        <Button 
          onClick={handleConnectPages} 
          disabled={connecting}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {connecting ? 'Connecting...' : 'Connect Pages'}
        </Button>
      </div>

      {/* Pages Grid */}
      {pages.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} className={`${!page.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {page.platform === 'FACEBOOK' ? (
                      <Facebook className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Instagram className="h-5 w-5 text-pink-600" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{page.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {page.platform.toLowerCase()} page
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={page.isActive ? 'default' : 'secondary'}>
                    {page.isActive ? 'Active' : 'Paused'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {page.stats.totalPosts}
                    </div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {page.stats.totalComments}
                    </div>
                    <div className="text-xs text-gray-500">Comments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {page.stats.avgSentiment.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Avg Score</div>
                  </div>
                </div>

                {/* Last Sync */}
                <div className="text-xs text-gray-500 text-center">
                  Last synced: {new Date(page.lastSync).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncPage(page.id)}
                    className="flex-1"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sync
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePage(page.id, page.isActive)}
                  >
                    {page.isActive ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePage(page.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-4 mb-4">
                <Facebook className="h-12 w-12 text-blue-600 opacity-50" />
                <Instagram className="h-12 w-12 text-pink-600 opacity-50" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                No Pages Connected
              </h3>
              <p className="text-gray-600 max-w-md">
                Connect your Facebook Pages and Instagram Business accounts to start 
                analyzing sentiment in your social media comments.
              </p>
              <div className="pt-4">
                <Button onClick={handleConnectPages} disabled={connecting}>
                  <Plus className="h-4 w-4 mr-2" />
                  {connecting ? 'Connecting...' : 'Connect Your First Page'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook Pages
              </h4>
              <p className="text-sm text-gray-600">
                Connect your Facebook Pages to analyze comments and posts. 
                You&apos;ll need admin access to the pages you want to connect.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Instagram className="h-4 w-4 text-pink-600" />
                Instagram Business
              </h4>
              <p className="text-sm text-gray-600">
                Connect Instagram Business accounts linked to your Facebook Pages. 
                Personal Instagram accounts are not supported.
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Required Permissions</h4>
            <div className="grid gap-2 md:grid-cols-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                pages_show_list
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3" />
                pages_read_engagement
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                pages_read_user_content
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

