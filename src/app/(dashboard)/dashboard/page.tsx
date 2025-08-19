'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface DashboardStats {
  totalComments: number
  totalPages: number
  sentimentBreakdown: {
    positive: number
    negative: number
    neutral: number
  }
  recentActivity: Array<{
    id: string
    type: string
    message: string
    timestamp: string
  }>
  processingJobs: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/fetch', { method: 'POST' })
      if (response.ok) {
        // Refresh stats after triggering fetch
        setTimeout(fetchStats, 2000)
      }
    } catch (error) {
      console.error('Failed to trigger refresh:', error)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalSentiments = stats ? 
    stats.sentimentBreakdown.positive + 
    stats.sentimentBreakdown.negative + 
    stats.sentimentBreakdown.neutral : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here&apos;s what&apos;s happening with your social media analysis.
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Fetching...' : 'Fetch Recent Data'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalComments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Analyzed across all pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Pages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPages || 0}</div>
            <p className="text-xs text-muted-foreground">
              Facebook & Instagram pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalSentiments > 0 
                ? Math.round((stats!.sentimentBreakdown.positive / totalSentiments) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.sentimentBreakdown.positive || 0} positive comments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Jobs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.processingJobs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Background tasks running
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Breakdown */}
      {totalSentiments > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis Overview</CardTitle>
            <CardDescription>
              Distribution of sentiment across all analyzed comments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Positive</span>
                <span>{stats!.sentimentBreakdown.positive} comments</span>
              </div>
              <Progress 
                value={(stats!.sentimentBreakdown.positive / totalSentiments) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Neutral</span>
                <span>{stats!.sentimentBreakdown.neutral} comments</span>
              </div>
              <Progress 
                value={(stats!.sentimentBreakdown.neutral / totalSentiments) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Negative</span>
                <span>{stats!.sentimentBreakdown.negative} comments</span>
              </div>
              <Progress 
                value={(stats!.sentimentBreakdown.negative / totalSentiments) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates from your social media analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1">
                    {activity.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {activity.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                    {activity.type === 'info' && <Clock className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-xs">Connect some pages to start analyzing!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

