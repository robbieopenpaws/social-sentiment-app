// src/app/(dashboard)/explorer/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Search, 
  Filter, 
  Download, 
  Eye,
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Facebook,
  Instagram,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Comment {
  id: string
  externalId: string
  message: string
  authorName?: string
  authorUsername?: string
  createdTime: string
  likeCount: number
  platform: 'FACEBOOK' | 'INSTAGRAM'
  post: {
    id: string
    externalId: string
    message?: string
    caption?: string
    page: {
      name: string
      platform: 'FACEBOOK' | 'INSTAGRAM'
    }
  }
  analysis?: {
    sentimentLabel: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
    sentimentScore: number
    toxicityScore: number
    keywords?: string[]
    language?: string
  }[]
}

interface Filters {
  search: string
  platform: string
  sentiment: string
  dateFrom: string
  dateTo: string
  page: string
}

export default function ExplorerPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    platform: '',
    sentiment: '',
    dateFrom: '',
    dateTo: '',
    page: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [pages, setPages] = useState<Array<{id: string, name: string, platform: string}>>([])

  useEffect(() => {
    fetchComments()
    fetchPages()
  }, [currentPage, filters])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })

      const response = await fetch(`/api/comments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/pages')
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages || [])
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    }
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      platform: '',
      sentiment: '',
      dateFrom: '',
      dateTo: '',
      page: ''
    })
    setCurrentPage(1)
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'NEGATIVE':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'NEUTRAL':
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'bg-green-100 text-green-800'
      case 'NEGATIVE':
        return 'bg-red-100 text-red-800'
      case 'NEUTRAL':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'FACEBOOK':
        return <Facebook className="h-4 w-4 text-blue-600" />
      case 'INSTAGRAM':
        return <Instagram className="h-4 w-4 text-pink-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const exportData = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      })

      const response = await fetch(`/api/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `comments-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comment Explorer</h1>
          <p className="text-muted-foreground">
            Search, filter, and analyze your social media comments
          </p>
        </div>
        <Button onClick={exportData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter comments by platform, sentiment, date range, and more
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search comments..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={filters.platform} onValueChange={(value) => handleFilterChange('platform', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All platforms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All platforms</SelectItem>
                  <SelectItem value="FACEBOOK">Facebook</SelectItem>
                  <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sentiment</Label>
              <Select value={filters.sentiment} onValueChange={(value) => handleFilterChange('sentiment', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All sentiments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sentiments</SelectItem>
                  <SelectItem value="POSITIVE">Positive</SelectItem>
                  <SelectItem value="NEUTRAL">Neutral</SelectItem>
                  <SelectItem value="NEGATIVE">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Page</Label>
              <Select value={filters.page} onValueChange={(value) => handleFilterChange('page', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All pages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All pages</SelectItem>
                  {pages.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            <div className="text-sm text-muted-foreground">
              {comments.length} comments found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
          <CardDescription>
            Click on any comment to view detailed analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Sentiment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.map((comment) => (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(comment.platform)}
                          <span className="text-sm">{comment.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {comment.authorName || comment.authorUsername || 'Anonymous'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {comment.post.page.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm line-clamp-2">{comment.message}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {comment.analysis?.[0] ? (
                          <div className="flex items-center gap-2">
                            {getSentimentIcon(comment.analysis[0].sentimentLabel)}
                            <Badge variant="secondary" className={getSentimentColor(comment.analysis[0].sentimentLabel)}>
                              {comment.analysis[0].sentimentLabel}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(comment.createdTime).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{comment.likeCount}</div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedComment(comment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Comment Details</DialogTitle>
                              <DialogDescription>
                                Detailed analysis and information for this comment
                              </DialogDescription>
                            </DialogHeader>
                            {selectedComment && (
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Comment</h4>
                                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedComment.message}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Author</h4>
                                    <p className="text-sm">{selectedComment.authorName || selectedComment.authorUsername || 'Anonymous'}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Platform</h4>
                                    <div className="flex items-center gap-2">
                                      {getPlatformIcon(selectedComment.platform)}
                                      <span className="text-sm">{selectedComment.platform}</span>
                                    </div>
                                  </div>
                                </div>

                                {selectedComment.analysis?.[0] && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Analysis</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Sentiment:</span>
                                        <Badge variant="secondary" className={getSentimentColor(selectedComment.analysis[0].sentimentLabel)}>
                                          {selectedComment.analysis[0].sentimentLabel}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                          ({(selectedComment.analysis[0].sentimentScore * 100).toFixed(1)}% confidence)
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Toxicity:</span>
                                        <span className="text-sm">
                                          {(selectedComment.analysis[0].toxicityScore * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                      {selectedComment.analysis[0].keywords && selectedComment.analysis[0].keywords.length > 0 && (
                                        <div>
                                          <span className="text-sm font-medium">Keywords:</span>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {selectedComment.analysis[0].keywords.map((keyword, i) => (
                                              <Badge key={i} variant="outline" className="text-xs">
                                                {keyword}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <h4 className="font-semibold mb-2">Post Context</h4>
                                  <p className="text-sm bg-gray-50 p-3 rounded">
                                    {selectedComment.post.message || selectedComment.post.caption || 'No post content available'}
                                  </p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No comments found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or connect more pages to see comments.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

