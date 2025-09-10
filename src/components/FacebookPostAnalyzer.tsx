'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Heart, Calendar, User, Loader2 } from 'lucide-react'

interface FacebookPost {
  id: string
  message: string
  created_time: string
  likes: {
    summary: {
      total_count: number
    }
  }
  comments: {
    summary: {
      total_count: number
    }
  }
}

interface FacebookComment {
  id: string
  message: string
  created_time: string
  from: {
    name: string
    id: string
  }
  like_count: number
}

interface FacebookPostAnalyzerProps {
  pageId: string
  pageAccessToken: string
  pageName: string
}

export default function FacebookPostAnalyzer({ pageId, pageAccessToken, pageName }: FacebookPostAnalyzerProps) {
  const [posts, setPosts] = useState<FacebookPost[]>([])
  const [comments, setComments] = useState<FacebookComment[]>([])
  const [selectedPost, setSelectedPost] = useState<FacebookPost | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/facebook-posts?pageId=${pageId}&pageAccessToken=${pageAccessToken}`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      } else {
        console.error('Failed to fetch posts')
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (postId: string) => {
    setLoadingComments(true)
    try {
      const response = await fetch('/api/facebook-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          pageAccessToken
        })
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      } else {
        console.error('Failed to fetch comments')
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handlePostSelect = (post: FacebookPost) => {
    setSelectedPost(post)
    setComments([])
    fetchComments(post.id)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Facebook Page: {pageName}</CardTitle>
          <CardDescription>
            Analyze posts and comments for sentiment analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={fetchPosts} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Posts...
              </>
            ) : (
              'Load Recent Posts'
            )}
          </Button>
        </CardContent>
      </Card>

      {posts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>
              Click on a post to view and analyze its comments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPost?.id === post.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handlePostSelect(post)}
              >
                <p className="text-sm text-gray-800 mb-2">
                  {post.message || 'No text content'}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(post.created_time)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.likes?.summary?.total_count || 0} likes
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {post.comments?.summary?.total_count || 0} comments
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedPost && (
        <Card>
          <CardHeader>
            <CardTitle>Comments Analysis</CardTitle>
            <CardDescription>
              Comments for the selected post
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading comments...
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">{comment.from.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(comment.created_time)}
                      </div>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{comment.message}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Heart className="h-3 w-3 mr-1" />
                        {comment.like_count} likes
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Sentiment: Analyzing...
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No comments found for this post.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

