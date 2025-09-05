'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

interface FacebookPage {
  id: string
  name: string
  access_token: string
  category?: string
  tasks?: string[]
}

export default function PagesPage() {
  const { data: session } = useSession()
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPages, setSelectedPages] = useState<string[]>([])

  useEffect(() => {
    if (session) {
      fetchPages()
    }
  }, [session])

  const fetchPages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/facebook/pages')
      const data = await response.json()
      
      if (response.ok) {
        setPages(data.pages || [])
      } else {
        setError(data.error || 'Failed to fetch pages')
      }
    } catch (err) {
      setError('Failed to connect to Facebook')
    } finally {
      setLoading(false)
    }
  }

  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev => 
      prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId]
    )
  }

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Facebook Pages</h1>
        <p>Please log in with Facebook to manage your pages.</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Facebook Pages</h1>
        <p className="text-gray-600">Connect your Facebook pages to start analyzing sentiment.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading your Facebook pages...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Error Loading Pages</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchPages}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && pages.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-yellow-800 mb-2">No Pages Found</h3>
          <p className="text-yellow-600 mb-4">
            We couldn't find any Facebook pages that you manage. This might be because:
          </p>
          <ul className="text-left text-yellow-600 mb-4 max-w-md mx-auto">
            <li>• Your pages are managed through Business Manager</li>
            <li>• You need additional permissions</li>
            <li>• Your pages aren't connected to your personal account</li>
          </ul>
          <button 
            onClick={fetchPages}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Refresh Pages
          </button>
        </div>
      )}

      {!loading && !error && pages.length > 0 && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Your Facebook Pages</h2>
            <p className="text-gray-600">
              Select the pages you want to analyze for sentiment. You have {pages.length} page(s) available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {pages.map((page) => (
              <div 
                key={page.id}
                className={`border rounded-lg p-6 cursor-pointer transition-all ${
                  selectedPages.includes(page.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => togglePageSelection(page.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{page.name}</h3>
                    <p className="text-sm text-gray-500">ID: {page.id}</p>
                    {page.category && (
                      <p className="text-sm text-gray-500">Category: {page.category}</p>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedPages.includes(page.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPages.includes(page.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>✓ Connected and ready for analysis</p>
                  {page.tasks && page.tasks.length > 0 && (
                    <p className="mt-1">Permissions: {page.tasks.join(', ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedPages.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-800 mb-2">
                {selectedPages.length} Page(s) Selected
              </h3>
              <p className="text-green-600 mb-4">
                You can now analyze sentiment for the selected pages. Go to Explorer to start analyzing posts and comments.
              </p>
              <div className="flex gap-3">
                <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                  Start Analysis
                </button>
                <button 
                  onClick={() => setSelectedPages([])}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
