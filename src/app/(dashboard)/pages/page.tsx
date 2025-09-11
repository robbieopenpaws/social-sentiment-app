// src/app/(dashboard)/pages/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Facebook, 
  Instagram, 
  Users, 
  Calendar,
  BarChart3,
  Settings,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface Page {
  id: string
  platform: 'FACEBOOK' | 'INSTAGRAM'
  externalId: string
  name: string
  pictureUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    posts: number
  }
}

export default function PagesPage() {
  const { data: session } = useSession()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [connectingPages, setConnectingPages] = useState(false)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/pages')
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages || [])
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectPages = async () => {
    setConnectingPages(true)
    try {
      const response = await fetch('/api/pages/connect', {
        method: 'POST'
      })
      if (response.ok) {
        await fetchPages()
      }
    } catch (error) {
      console.error('Error connecting pages:', error)
    } finally {
      setConnectingPages(false)
    }
  }

  const togglePageStatus = async (pageId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !isActive })
      })
      if (response.ok) {
        await fetchPages()
      }
    } catch (error) {
      console.error('Error updating page status:', error)
    }
  }

  const deletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to remove this page? This will also delete all associated data.')) {
      return
    }

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await fetchPages()
      }
    } catch (error) {
      console.error('Error deleting page:', error)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK':
        return <Facebook className="h-5 w-5 text-blue-600" />
      case 'INSTAGRAM':
        return <Instagram className="h-5 w-5 text-pink-600" />
      default:
        return <Users className="h-5 w-5 text-gray-600" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK':
        return 'bg-blue-100 text-blue-800'
      case 'INSTAGRAM':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connected Pages</h1>
          <p className="text-muted-foreground">
            Manage your Facebook and Instagram pages for sentiment analysis
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Connect Pages
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect Social Media Pages</DialogTitle>
              <DialogDescription>
                Connect your Facebook Pages and Instagram Business accounts to start analyzing comments.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>To connect pages, you&apos;ll need:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Admin access to Facebook Pages</li>
                  <li>Instagram Business accounts linked to Facebook Pages</li>
                  <li>Appropriate permissions for reading posts and comments</li>
                </ul>
              </div>
              <Button 
                onClick={connectPages} 
                disabled={connectingPages}
                className="w-full"
              >
                {connectingPages ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Facebook className="mr-2 h-4 w-4" />
                    Connect with Facebook
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pages Grid */}
      {pages.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Card key={page.id} className={`transition-all ${page.isActive ? 'border-green-200' : 'border-gray-200'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPlatformIcon(page.platform)}
                    <Badge variant="secondary" className={getPlatformColor(page.platform)}>
                      {page.platform}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {page.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{page.name}</CardTitle>
                <CardDescription>
                  {page.isActive ? 'Active' : 'Inactive'} • Connected {new Date(page.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Posts analyzed:</span>
                  <span className="font-medium">{page._count?.posts || 0}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last updated:</span>
                  <span className="font-medium">
                    {new Date(page.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePageStatus(page.id, page.isActive)}
                  >
                    {page.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePage(page.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pages connected</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Connect your Facebook Pages and Instagram Business accounts to start analyzing sentiment in comments.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Connect Your First Page
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Social Media Pages</DialogTitle>
                  <DialogDescription>
                    Connect your Facebook Pages and Instagram Business accounts to start analyzing comments.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>To connect pages, you&apos;ll need:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Admin access to Facebook Pages</li>
                      <li>Instagram Business accounts linked to Facebook Pages</li>
                      <li>Appropriate permissions for reading posts and comments</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={connectPages} 
                    disabled={connectingPages}
                    className="w-full"
                  >
                    {connectingPages ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Facebook className="mr-2 h-4 w-4" />
                        Connect with Facebook
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

