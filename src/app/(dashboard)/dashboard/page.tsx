'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalComments: number
  totalPages: number
  sentimentBreakdown: {
    positive: number
    negative: number
    neutral: number
  }
  processingJobs: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return <div>Loading dashboard...</div>
  }

  const totalSentiments = stats ? 
    stats.sentimentBreakdown.positive + 
    stats.sentimentBreakdown.negative + 
    stats.sentimentBreakdown.neutral : 0

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Dashboard</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>
        Welcome back! Here&apos;s what&apos;s happening with your social media analysis.
      </p>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Total Comments</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {stats?.totalComments || 0}
          </div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
            Analyzed across all pages
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Connected Pages</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {stats?.totalPages || 0}
          </div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
            Facebook & Instagram pages
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Positive Sentiment</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {totalSentiments > 0 
              ? Math.round((stats!.sentimentBreakdown.positive / totalSentiments) * 100)
              : 0}%
          </div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
            {stats?.sentimentBreakdown.positive || 0} positive comments
          </p>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>Processing Jobs</h3>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
            {stats?.processingJobs || 0}
          </div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666' }}>
            Background tasks running
          </p>
        </div>
      </div>

      {/* Sentiment Breakdown */}
      {totalSentiments > 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '1.5rem', 
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Sentiment Analysis Overview</h2>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            Distribution of sentiment across all analyzed comments
          </p>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#10b981' }}>Positive</span>
              <span>{stats!.sentimentBreakdown.positive} comments</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#e5e7eb', 
              borderRadius: '4px' 
            }}>
              <div style={{ 
                width: `${(stats!.sentimentBreakdown.positive / totalSentiments) * 100}%`,
                height: '100%',
                backgroundColor: '#10b981',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#6b7280' }}>Neutral</span>
              <span>{stats!.sentimentBreakdown.neutral} comments</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#e5e7eb', 
              borderRadius: '4px' 
            }}>
              <div style={{ 
                width: `${(stats!.sentimentBreakdown.neutral / totalSentiments) * 100}%`,
                height: '100%',
                backgroundColor: '#6b7280',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#ef4444' }}>Negative</span>
              <span>{stats!.sentimentBreakdown.negative} comments</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#e5e7eb', 
              borderRadius: '4px' 
            }}>
              <div style={{ 
                width: `${(stats!.sentimentBreakdown.negative / totalSentiments) * 100}%`,
                height: '100%',
                backgroundColor: '#ef4444',
                borderRadius: '4px'
              }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Getting Started */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>Getting Started</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          Your social media sentiment analysis dashboard is ready! Here&apos;s what you can do:
        </p>
        <ul style={{ color: '#666', paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>Connect your Facebook Pages and Instagram accounts</li>
          <li style={{ marginBottom: '0.5rem' }}>View detailed sentiment analysis of your comments</li>
          <li style={{ marginBottom: '0.5rem' }}>Export your data in various formats</li>
          <li style={{ marginBottom: '0.5rem' }}>Monitor sentiment trends over time</li>
        </ul>
      </div>
    </div>
  )
}

