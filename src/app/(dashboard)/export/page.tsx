'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Download, 
  FileText, 
  Database, 
  Filter,
  Calendar,
  CheckCircle
} from 'lucide-react'

interface ExportOptions {
  format: 'csv' | 'json' | 'excel'
  dataType: 'comments' | 'pages' | 'analysis'
  dateFrom: string
  dateTo: string
  pageId: string
  sentiment: string
  platform: string
  fields: string[]
}

interface PageOption {
  id: string
  name: string
  platform: string
}

const AVAILABLE_FIELDS = {
  comments: [
    { id: 'content', label: 'Comment Content', default: true },
    { id: 'author', label: 'Author Name', default: true },
    { id: 'created', label: 'Created Date', default: true },
    { id: 'platform', label: 'Platform', default: true },
    { id: 'page', label: 'Page Name', default: true },
    { id: 'sentiment', label: 'Sentiment Analysis', default: true },
    { id: 'toxicity', label: 'Toxicity Score', default: false },
    { id: 'keywords', label: 'Keywords', default: false },
    { id: 'likes', label: 'Like Count', default: false }
  ],
  pages: [
    { id: 'name', label: 'Page Name', default: true },
    { id: 'platform', label: 'Platform', default: true },
    { id: 'status', label: 'Status', default: true },
    { id: 'lastSync', label: 'Last Sync', default: true },
    { id: 'stats', label: 'Statistics', default: true }
  ],
  analysis: [
    { id: 'sentiment', label: 'Sentiment Label', default: true },
    { id: 'score', label: 'Sentiment Score', default: true },
    { id: 'toxicity', label: 'Toxicity Score', default: true },
    { id: 'keywords', label: 'Keywords', default: true },
    { id: 'created', label: 'Analysis Date', default: true }
  ]
}

export default function ExportPage() {
  const { data: session } = useSession()
  const [pages, setPages] = useState<PageOption[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dataType: 'comments',
    dateFrom: '',
    dateTo: '',
    pageId: '',
    sentiment: '',
    platform: '',
    fields: AVAILABLE_FIELDS.comments.filter(f => f.default).map(f => f.id)
  })

  const fetchPages = async () => {
    setLoading(true)
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

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    setExportOptions(prev => ({
      ...prev,
      fields: checked 
        ? [...prev.fields, fieldId]
        : prev.fields.filter(f => f !== fieldId)
    }))
  }

  const handleDataTypeChange = (dataType: 'comments' | 'pages' | 'analysis') => {
    const defaultFields = AVAILABLE_FIELDS[dataType].filter(f => f.default).map(f => f.id)
    setExportOptions(prev => ({
      ...prev,
      dataType,
      fields: defaultFields
    }))
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      
      // Add all export options as query parameters
      Object.entries(exportOptions).forEach(([key, value]) => {
        if (value && value !== '') {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/export?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `export-${Date.now()}.${exportOptions.format}`

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const currentFields = AVAILABLE_FIELDS[exportOptions.dataType] || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Export Data</h1>
        <p className="text-gray-600">
          Export your social media data and analysis results in various formats
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Export Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Type
              </CardTitle>
              <CardDescription>
                Choose what type of data you want to export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportOptions.dataType === 'comments' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleDataTypeChange('comments')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Comments</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Export all comments with sentiment analysis
                  </p>
                </div>

                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportOptions.dataType === 'pages' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleDataTypeChange('pages')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Pages</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Export connected pages and their statistics
                  </p>
                </div>

                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    exportOptions.dataType === 'analysis' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleDataTypeChange('analysis')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Analysis</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Export detailed sentiment analysis results
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Export Format</CardTitle>
              <CardDescription>
                Choose the file format for your export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={exportOptions.format} 
                onValueChange={(value: 'csv' | 'json' | 'excel') => 
                  setExportOptions(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                  <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
                  <SelectItem value="excel">Excel (CSV with Excel formatting)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>
                Apply filters to narrow down your export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={exportOptions.dateFrom}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      dateFrom: e.target.value 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={exportOptions.dateTo}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      dateTo: e.target.value 
                    }))}
                  />
                </div>
              </div>

              {/* Page Filter */}
              <div className="space-y-2">
                <Label>Specific Page (Optional)</Label>
                <Select 
                  value={exportOptions.pageId} 
                  onValueChange={(value) => 
                    setExportOptions(prev => ({ ...prev, pageId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All pages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All pages</SelectItem>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={page.id}>
                        {page.name} ({page.platform})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform Filter */}
              <div className="space-y-2">
                <Label>Platform</Label>
                <Select 
                  value={exportOptions.platform} 
                  onValueChange={(value) => 
                    setExportOptions(prev => ({ ...prev, platform: value }))
                  }
                >
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

              {/* Sentiment Filter */}
              {exportOptions.dataType === 'comments' && (
                <div className="space-y-2">
                  <Label>Sentiment</Label>
                  <Select 
                    value={exportOptions.sentiment} 
                    onValueChange={(value) => 
                      setExportOptions(prev => ({ ...prev, sentiment: value }))
                    }
                  >
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
              )}
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Fields to Include</CardTitle>
              <CardDescription>
                Select which fields to include in your export
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {currentFields.map((field) => (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={exportOptions.fields.includes(field.id)}
                      onCheckedChange={(checked) => 
                        handleFieldToggle(field.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={field.id} className="text-sm">
                      {field.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Type:</span>
                  <span className="font-medium capitalize">{exportOptions.dataType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Format:</span>
                  <span className="font-medium uppercase">{exportOptions.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fields:</span>
                  <span className="font-medium">{exportOptions.fields.length}</span>
                </div>
                {exportOptions.dateFrom && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">From:</span>
                    <span className="font-medium">{exportOptions.dateFrom}</span>
                  </div>
                )}
                {exportOptions.dateTo && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">To:</span>
                    <span className="font-medium">{exportOptions.dateTo}</span>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleExport}
                disabled={exporting || exportOptions.fields.length === 0}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </CardContent>
          </Card>

          {/* Export Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Export Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>CSV:</strong> Best for spreadsheet applications like Excel or Google Sheets
              </p>
              <p>
                <strong>JSON:</strong> Ideal for developers and data analysis tools
              </p>
              <p>
                <strong>Excel:</strong> CSV format optimized for Microsoft Excel
              </p>
              <p>
                Use date filters to export specific time periods and reduce file size.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

