'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import FacebookPageSelector from '@/components/FacebookPageSelector'
import FacebookPostAnalyzer from '@/components/FacebookPostAnalyzer'

interface FacebookPage {
  id: string
  name: string
  category: string
  access_token: string
  tasks: string[]
}

export default function FacebookPage() {
  const { data: session } = useSession()
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null)

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Please log in to access Facebook analysis.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Facebook Analysis</h1>
        <p className="text-gray-600 mt-2">
          Analyze sentiment from your Facebook page posts and comments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FacebookPageSelector onPageSelected={setSelectedPage} />
        </div>
        
        <div className="lg:col-span-2">
          {selectedPage ? (
            <FacebookPostAnalyzer
              pageId={selectedPage.id}
              pageAccessToken={selectedPage.access_token}
              pageName={selectedPage.name}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">Select a Facebook page to start analyzing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

