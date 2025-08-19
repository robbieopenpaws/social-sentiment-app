// src/app/(dashboard)/insights/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart as PieChartIcon,
  Calendar,
  Users,
  MessageSquare,
  Download,
  RefreshCw
} from 'lucide-react'

interface InsightsData {
  sentimentOverTime: Array<{
    date: string
    positive: number
    negative: number
    neutral: number
  }>
  sentimentByPage: Array<{
    pageName: string
    positive: number
    negative: number
    neutral: number
    total: number
  }>
  topKeywords: Array<{
    keyword: string
    count: number
    sentiment: 'positive' | 'negative' | 'neutral'
  }>
  toxicityTrends: Array<{
    date: string
    averageToxicity: number
    highToxicityCount: number
  }>
  engagementMetrics: Array<{
    date: string
    totalComments: number
    totalLikes: number
    averageSentiment: number
  }>
  summary: {
    totalComments: number
    averageSentiment: number
    toxicityRate: number
    mostActiveDay: string
    topPerformingPage: string
  }
}

const SENTIMENT_COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  neutral: '#6b7280'
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedPage, setSelectedPage] = useState('all')
  const [pages, setPages] = useState<Array<{id: string, name: string}>>([])

  useEffect(() => {
    fetchInsights()
    fetchPages()
  }, [timeRange, selectedPage])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        timeRange,
        ...(selectedPage !== 'all' && { pageId: selectedPage })
      })

      const response = await fetch(`/api/insights?${params}`)
      if (response.ok) {
        const insightsData = await response.json()
        setData(insightsData)
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/pages')
      if (response.ok) {
        const pagesData = await response.json()
        setPages(pagesData.pages || [])
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
    }
  }

  const exportInsights = async () => {
    try {
      const params = new URLSearchParams({
        format: 'pdf',
        timeRange,
        ...(selectedPage !== 'all' && { pageId: selectedPage })
      })

      const response = await fetch(`/api/insights/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `insights-report-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting insights:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of your social media sentiment data
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInsights}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={exportInsights}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPage} onValueChange={setSelectedPage}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pages</SelectItem>
            {pages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.totalComments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Analyzed comments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Sentiment</CardTitle>
              {data.summary.averageSentiment > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.averageSentiment > 0 ? '+' : ''}{(data.summary.averageSentiment * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Sentiment score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toxicity Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(data.summary.toxicityRate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                High toxicity comments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Page</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold truncate">{data.summary.topPerformingPage}</div>
              <p className="text-xs text-muted-foreground">
                Most active page
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="sentiment" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="toxicity">Toxicity</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
        </TabsList>

        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Sentiment Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Over Time</CardTitle>
                <CardDescription>
                  Daily sentiment trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data?.sentimentOverTime || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="positive" 
                      stackId="1"
                      stroke={SENTIMENT_COLORS.positive} 
                      fill={SENTIMENT_COLORS.positive}
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="neutral" 
                      stackId="1"
                      stroke={SENTIMENT_COLORS.neutral} 
                      fill={SENTIMENT_COLORS.neutral}
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="negative" 
                      stackId="1"
                      stroke={SENTIMENT_COLORS.negative} 
                      fill={SENTIMENT_COLORS.negative}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sentiment by Page */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment by Page</CardTitle>
                <CardDescription>
                  Sentiment distribution across pages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data?.sentimentByPage || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pageName" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="positive" fill={SENTIMENT_COLORS.positive} />
                    <Bar dataKey="neutral" fill={SENTIMENT_COLORS.neutral} />
                    <Bar dataKey="negative" fill={SENTIMENT_COLORS.negative} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>
                Comments and likes over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data?.engagementMetrics || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="totalComments" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="totalLikes" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="toxicity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Toxicity Trends</CardTitle>
              <CardDescription>
                Toxicity levels and high-toxicity comment counts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data?.toxicityTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="averageToxicity" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="highToxicityCount" 
                    fill="#fca5a5" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Keywords</CardTitle>
              <CardDescription>
                Most frequently mentioned keywords by sentiment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topKeywords?.slice(0, 10).map((keyword, index) => (
                  <div key={keyword.keyword} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-8">{index + 1}</span>
                      <span className="font-medium">{keyword.keyword}</span>
                      <Badge 
                        variant="secondary" 
                        className={
                          keyword.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          keyword.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {keyword.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (keyword.count / (data.topKeywords[0]?.count || 1)) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{keyword.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

