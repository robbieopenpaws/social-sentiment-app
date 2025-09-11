// src/app/(dashboard)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface DashboardStats {
  totalPages: number
  totalPosts: number
  totalComments: number
  totalAnalyses: number
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
  queueStats: {
    queued: number
    running: number
    completed: number
    failed: number
  }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const totalSentiments = stats ? 
    stats.sentimentBreakdown.positive + stats.sentimentBreakdown.negative + stats.sentimentBreakdown.neutral : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your social media sentiment analysis.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Posts analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalComments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Comments collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAnalyses || 0}</div>
            <p className="text-xs text-muted-foreground">
              Sentiment analyses completed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Sentiment Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Overview</CardTitle>
            <CardDescription>
              Distribution of sentiment across all analyzed comments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && totalSentiments > 0 ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Positive</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats.sentimentBreakdown.positive}
                    </Badge>
                  </div>
                  <Progress 
                    value={(stats.sentimentBreakdown.positive / totalSentiments) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Neutral</span>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                      {stats.sentimentBreakdown.neutral}
                    </Badge>
                  </div>
                  <Progress 
                    value={(stats.sentimentBreakdown.neutral / totalSentiments) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Negative</span>
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      {stats.sentimentBreakdown.negative}
                    </Badge>
                  </div>
                  <Progress 
                    value={(stats.sentimentBreakdown.negative / totalSentiments) * 100} 
                    className="h-2"
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No sentiment data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Queue Status */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>
              Current status of background jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.queueStats ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Queued</span>
                  </div>
                  <Badge variant="outline">{stats.queueStats.queued}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-yellow-500 animate-pulse" />
                    <span className="text-sm font-medium">Running</span>
                  </div>
                  <Badge variant="outline">{stats.queueStats.running}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <Badge variant="outline">{stats.queueStats.completed}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Failed</span>
                  </div>
                  <Badge variant="outline">{stats.queueStats.failed}</Badge>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No job data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                  <div className="flex-shrink-0">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Connect New Page
            </Button>
            <Button variant="outline" size="sm">
              Fetch Recent Data
            </Button>
            <Button variant="outline" size="sm">
              View Insights
            </Button>
            <Button variant="outline" size="sm">
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

