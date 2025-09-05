'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { CheckCircleIcon, PlusCircleIcon } from '@heroicons/react/24/solid'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

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
      setError(null)
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

  const selectAllPages = () => {
    setSelectedPages(pages.map(page => page.id))
  }

  const clearSelection = () => {
    setSelectedPages([])
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Pages</h1>
            <p className="text-gray-600 mb-6">Please log in with Facebook to manage your pages and start analyzing sentiment.</p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Sign In with Facebook
            </button>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Facebook Pages</h1>
              <p className="text-gray-600 mt-2">Connect your Facebook pages to start analyzing sentiment and engagement.</p>
            </div>
            <button 
              onClick={fetchPages}
              disabled={loading}
              className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Your Pages</h3>
              <p className="text-gray-600">Connecting to Facebook and fetching your pages...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Pages</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button 
                  onClick={fetchPages}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Pages State */}
        {!loading && !error && pages.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Pages Found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any Facebook pages that you manage. This might be because your pages are managed through Business Manager or you need additional permissions.
              </p>
              <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700 font-medium">Possible reasons:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Pages are managed through Facebook Business Manager</li>
                  <li>• Additional permissions are required</li>
                  <li>• Pages aren't connected to your personal account</li>
                </ul>
              </div>
              <button 
                onClick={fetchPages}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Refresh Pages
              </button>
            </div>
          </div>
        )}

        {/* Pages Grid */}
        {!loading && !error && pages.length > 0 && (
          <div className="space-y-6">
            {/* Selection Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {pages.length} Page{pages.length !== 1 ? 's' : ''} Available
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {selectedPages.length > 0 
                      ? `${selectedPages.length} selected for analysis`
                      : 'Select pages to analyze their sentiment'
                    }
                  </p>
                </div>
                <div className="flex gap-3">
                  {selectedPages.length > 0 && (
                    <button 
                      onClick={clearSelection}
                      className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  <button 
                    onClick={selectAllPages}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Select All
                  </button>
                </div>
              </div>
            </div>

            {/* Pages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pages.map((page) => {
                const isSelected = selectedPages.includes(page.id)
                return (
                  <div 
                    key={page.id}
                    onClick={() => togglePageSelection(page.id)}
                    className={`relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-pointer group hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Selection Indicator */}
                    <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300 group-hover:border-gray-400'
                    }`}>
                      {isSelected && (
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                      )}
                    </div>

                    <div className="p-6">
                      {/* Page Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                        <span className="text-white font-bold text-lg">
                          {page.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Page Info */}
                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1 pr-8">{page.name}</h3>
                        {page.category && (
                          <p className="text-sm text-gray-500 mb-2">{page.category}</p>
                        )}
                        <p className="text-xs text-gray-400">ID: {page.id}</p>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-green-700 font-medium">Connected</span>
                      </div>

                      {/* Permissions */}
                      {page.tasks && page.tasks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Permissions: {page.tasks.slice(0, 2).join(', ')}
                            {page.tasks.length > 2 && ` +${page.tasks.length - 2} more`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected Pages Summary */}
            {selectedPages.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">
                        {selectedPages.length} Page{selectedPages.length !== 1 ? 's' : ''} Selected
                      </h3>
                      <p className="text-green-700 text-sm">
                        Ready to analyze sentiment and engagement data
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={clearSelection}
                      className="text-green-700 hover:text-green-800 text-sm font-medium transition-colors"
                    >
                      Clear
                    </button>
                    <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                      Start Analysis
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
