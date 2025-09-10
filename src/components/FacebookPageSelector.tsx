'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Facebook, Loader2 } from 'lucide-react'

interface FacebookPage {
  id: string
  name: string
  category: string
  access_token: string
  tasks: string[]
}

interface FacebookPageSelectorProps {
  onPageSelected: (page: FacebookPage) => void
}

export default function FacebookPageSelector({ onPageSelected }: FacebookPageSelectorProps) {
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPageId, setSelectedPageId] = useState<string>('')

  const fetchPages = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/facebook-pages')
      if (response.ok) {
        const data = await response.json()
        setPages(data.pages)
      } else {
        console.error('Failed to fetch pages')
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePageSelect = (pageId: string) => {
    setSelectedPageId(pageId)
    const selectedPage = pages.find(page => page.id === pageId)
    if (selectedPage) {
      onPageSelected(selectedPage)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          Select Facebook Page
        </CardTitle>
        <CardDescription>
          Choose a Facebook page to analyze comments and posts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={fetchPages} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Pages...
            </>
          ) : (
            'Load My Facebook Pages'
          )}
        </Button>

        {pages.length > 0 && (
          <Select value={selectedPageId} onValueChange={handlePageSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a page" />
            </SelectTrigger>
            <SelectContent>
              {pages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{page.name}</span>
                    <span className="text-sm text-gray-500">{page.category}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  )
}

