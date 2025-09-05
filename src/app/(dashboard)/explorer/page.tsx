'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface FacebookPost {
  id: string
  message?: string
  created_time: string
  likes?: { summary: { total_count: number } }
  comments?: { 
    data: Array<{
      id: string
      message: string
      created_time: string
      from: { name: string }
      sentiment?: 'positive' | 'negative' | 'neutral'
    }>
    summary: { total_count: number }
  }
}

interface FacebookPage {
  id: string
  name: string
}

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const HeartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

const ChatIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const RefreshIcon = ({ spinning = false }: { spinning?: boolean }) => (
  <svg className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

// Simple sentiment analysis function
const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'excellent', 'fantastic', 'wonderful', 'perfect', 'best', 'beautiful', 'nice', 'happy', 'thank', 'thanks']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disgusting', 'angry', 'sad', 'disappointed', 'annoying', 'stupid', 'ugly', 'boring']
  
  const lowerText = text.toLowerCase()
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'text-green-600 bg-green-50'
    case 'negative': return 'text-red-600 bg-red-50'
    default: return 'text-gray-600 bg-gray-50'
  }
}

const getSentimentEmoji = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return '😊'
    case 'negative': return '😞'
    default: return '😐'
  }
}

export default function ExplorerPage() {
  const { data: session } = useSession()
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [selectedPage, setSelectedPage] = useState<string>('')
  const [posts, setPosts] = useState<FacebookPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchPages()
    }
  }, [session])

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/facebook/pages')
      const data = await response.json()
      if (response.ok && data.pages) {
        setPages(data.pages)
        if (data.pages.length > 0) {
          setSelectedPage(data.pages[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching pages:', err)
    }
  }

  const fetchPosts = async (pageId: string) => {
    if (!pageId) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/facebook/posts?pageId=${pageId}`)
      const data = await response.json()
      
      if (response.ok) {
        // Add sentiment analysis to comments
        const postsWithSentiment = data.posts?.map((post: FacebookPost) => ({
          ...post,
          comments: post.comments ? {
            ...post.comments,
            data: post.comments.data.map(comment => ({
              ...comment,
              sentiment: analyzeSentiment(comment.message)
            }))
          } : undefined
        })) || []
        
        setPosts(postsWithSentiment)
      } else {
        setError(data.error || 'Failed to fetch posts')
      }
    } catch (err) {
      setError('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedPage) {
      fetchPosts(selectedPage)
    }
  }, [selectedPage])

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <SearchIcon />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Explore Content</h1>
            <p className="text-gray-600 mb-6">Please log in with Facebook to explore your page content.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Explorer</h1>
          <p className="text-gray-600 mt-2">Explore posts and comments from your Facebook pages with sentiment analysis.</p>
        </div>

        {/* Page Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Page to Explore</h2>
              {pages.length > 0 ? (
                <select 
                  value={selectedPage} 
                  onChange={(e) => setSelectedPage(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {pages.map(page => (
                    <option key={page.id} value={page.id}>{page.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-600">No pages available. Please connect your pages first.</p>
              )}
            </div>
            <button 
              onClick={() => fetchPosts(selectedPage)}
              disabled={loading || !selectedPage}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshIcon spinning={loading} />
              Refresh Posts
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <RefreshIcon spinning={true} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Loading Posts</h3>
              <p className="text-gray-600">Fetching content from your Facebook page...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Error Loading Posts</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Posts */}
        {!loading && !error && posts.length === 0 && selectedPage && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Found</h3>
              <p className="text-gray-600">This page doesn't have any recent posts, or you may need additional permissions to view them.</p>
            </div>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Post Content */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500">
                      {new Date(post.created_time).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  {post.message && (
                    <p className="text-gray-900 mb-4">{post.message}</p>
                  )}

                  {/* Post Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <HeartIcon />
                      <span>{post.likes?.summary?.total_count || 0} likes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ChatIcon />
                      <span>{post.comments?.summary?.total_count || 0} comments</span>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                {post.comments && post.comments.data.length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Comments & Sentiment Analysis</h4>
                    <div className="space-y-3">
                      {post.comments.data.slice(0, 5).map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-sm text-gray-900">{comment.from.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(comment.sentiment || 'neutral')}`}>
                                {getSentimentEmoji(comment.sentiment || 'neutral')} {comment.sentiment || 'neutral'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.created_time).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{comment.message}</p>
                        </div>
                      ))}
                      
                      {post.comments.data.length > 5 && (
                        <p className="text-sm text-gray-500 text-center">
                          And {post.comments.data.length - 5} more comments...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
