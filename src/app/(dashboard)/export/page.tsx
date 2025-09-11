// src/app/(dashboard)/export/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  Database, 
  BarChart3,
  Calendar,
  Filter,
  CheckCircle
} from 'lucide-react'

interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx'
  dataType: 'comments' | 'analysis' | 'aggregated'
  dateFrom: string
  dateTo: string
  pageId: string
  sentiment: string
  includeFields: {
    commentId: boolean
    authorName: boolean
    message: boolean
    sentiment: boolean
    sentimentScore: boolean
    toxicityScore: boolean
    keywords: boolean
    platform: boolean
    createdTime: boolean
    likeCount: boolean
    pageName: boolean
    postContent: boolean
  }
}

export default function ExportPage() {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    dataType: 'comments',
    dateFrom: '',
    dateTo: '',
    pageId: '',
    sentiment: '',
    includeFields: {
      commentId: true,
      authorName: true,
      message: true,
      sentiment: true,
      sentimentScore: true,
      toxicityScore: false,
      keywords: true,
      platform: true,
      createdTime: true,
      likeCount: true,
      pageName: true,
      postContent: false
    }
  })
  
  const [pages, setPages] = useState<Array<{id: string, name: string}>>([])
  const [exporting, setExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<Array<{
    id: string
    filename: string
    format: string
    dataType: string
    recordCount: number
    createdAt: string
    downloadUrl: string
  }>>([])

  useEffect(() => {
    fetchPages()
    fetchExportHistory()
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
    }
  }

  const fetchExportHistory = async () => {
    try {
      const response = await fetch('/api/export/history')
      if (response.ok) {
        const data = await response.json()
        setExportHistory(data.exports || [])
      }
    } catch (error) {
      console.error('Error fetching export history:', error)
    }
  }

  const handleFieldToggle = (field: keyof typeof options.includeFields) => {
    setOptions(prev => ({
      ...prev,
      includeFields: {
        ...prev.includeFields,
        [field]: !prev.includeFields[field]
      }
    }))
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        format: options.format,
        dataType: options.dataType,
        ...(options.dateFrom && { dateFrom: options.dateFrom }),
        ...(options.dateTo && { dateTo: options.dateTo }),
        ...(options.pageId && { pageId: options.pageId }),
        ...(options.sentiment && { sentiment: options.sentiment }),
        fields: Object.entries(options.includeFields)
          .filter(([_, include]) => include)
          .map(([field]) => field)
          .join(',')
      })

      const response = await fetch(`/api/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `social-sentiment-${options.dataType}-${timestamp}.${options.format}`
        a.download = filename
        
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Refresh export history
        await fetchExportHistory()
      } else {
        console.error('Export failed:', response.statusText)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExporting(false)
    }
  }

  const getDataTypeDescription = (dataType: string) => {
    switch (dataType) {
      case 'comments':
        return 'Individual comments with analysis results'
      case 'analysis':
        return 'Sentiment analysis results only'
      case 'aggregated':
        return 'Aggregated statistics by post/page'
      default:
        return ''
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <FileText className="h-4 w-4" />
      case 'json':
        return <Database className="h-4 w-4" />
      case 'xlsx':
        return <BarChart3 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Export</h1>
        <p className="text-muted-foreground">
          Export your social media sentiment data in various formats
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Export Configuration</CardTitle>
            <CardDescription>
              Configure your data export settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={options.format} onValueChange={(value: 'csv' | 'json' | 'xlsx') => setOptions(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                  <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Type Selection */}
            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select value={options.dataType} onValueChange={(value: 'comments' | 'analysis' | 'aggregated') => setOptions(prev => ({ ...prev, dataType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comments">Comments with Analysis</SelectItem>
                  <SelectItem value="analysis">Analysis Results Only</SelectItem>
                  <SelectItem value="aggregated">Aggregated Statistics</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {getDataTypeDescription(options.dataType)}
              </p>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Label className="text-base font-medium">Filters</Label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={options.dateFrom}
                    onChange={(e) => setOptions(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={options.dateTo}
                    onChange={(e) => setOptions(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Page</Label>
                <Select value={options.pageId} onValueChange={(value) => setOptions(prev => ({ ...prev, pageId: value }))}>
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
                <Label>Sentiment</Label>
                <Select value={options.sentiment} onValueChange={(value) => setOptions(prev => ({ ...prev, sentiment: value }))}>
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
            </div>

            {/* Field Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Include Fields</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {Object.entries(options.includeFields).map(([field, included]) => (
                  <div key={field} className="flex items-center space-x-2">
                    <Checkbox
                      id={field}
                      checked={included}
                      onCheckedChange={() => handleFieldToggle(field as keyof typeof options.includeFields)}
                    />
                    <Label htmlFor={field} className="text-sm font-normal">
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <Button 
              onClick={handleExport} 
              disabled={exporting}
              className="w-full"
              size="lg"
            >
              {exporting ? (
                <>
                  <Download className="mr-2 h-4 w-4 animate-pulse" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card>
          <CardHeader>
            <CardTitle>Export History</CardTitle>
            <CardDescription>
              Your recent data exports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exportHistory.length > 0 ? (
              <div className="space-y-4">
                {exportHistory.map((export_) => (
                  <div key={export_.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFormatIcon(export_.format)}
                      <div>
                        <p className="font-medium text-sm">{export_.filename}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {export_.format.toUpperCase()}
                          </Badge>
                          <span>{export_.recordCount.toLocaleString()} records</span>
                          <span>•</span>
                          <span>{new Date(export_.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={export_.downloadUrl} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No exports yet</h3>
                <p className="text-muted-foreground text-sm">
                  Your exported files will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export Templates</CardTitle>
          <CardDescription>
            Pre-configured export options for common use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setOptions(prev => ({
                ...prev,
                format: 'csv',
                dataType: 'comments',
                includeFields: {
                  ...prev.includeFields,
                  commentId: true,
                  authorName: true,
                  message: true,
                  sentiment: true,
                  sentimentScore: true,
                  platform: true,
                  createdTime: true
                }
              }))}
            >
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium">Basic Comments Report</p>
                <p className="text-sm text-muted-foreground">Comments with basic sentiment analysis</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setOptions(prev => ({
                ...prev,
                format: 'xlsx',
                dataType: 'analysis',
                includeFields: {
                  ...prev.includeFields,
                  sentiment: true,
                  sentimentScore: true,
                  toxicityScore: true,
                  keywords: true,
                  platform: true,
                  createdTime: true
                }
              }))}
            >
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium">Detailed Analysis</p>
                <p className="text-sm text-muted-foreground">Complete sentiment and toxicity analysis</p>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => setOptions(prev => ({
                ...prev,
                format: 'csv',
                dataType: 'aggregated',
                dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                dateTo: new Date().toISOString().split('T')[0]
              }))}
            >
              <Calendar className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <p className="font-medium">Monthly Summary</p>
                <p className="text-sm text-muted-foreground">Aggregated stats for the last 30 days</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

