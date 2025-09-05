'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon, HeartIcon } from '@heroicons/react/24/outline'

export default function ExplorerPage() {
  const { data: session } = useSession()
  const [selectedPage, setSelectedPage] = useState<string>('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <MagnifyingGlassIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
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
          <p className="text-gray-600 mt-2">Explore posts and comments from your Facebook pages to analyze sentiment.</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Content Explorer Coming Soon</h3>
            <p className="text-gray-600 mb-6">
              We're building an amazing content exploration experience where you'll be able to browse posts, analyze comments, and track sentiment trends.
            </p>
            
            {/* Feature Preview */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">What's Coming:</h4>
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Browse posts from your connected pages</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">View comments and engagement metrics</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Real-time sentiment analysis</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Filter and search content</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              For now, make sure to connect your pages in the Pages section to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
