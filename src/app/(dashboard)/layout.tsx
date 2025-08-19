'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '250px', 
        backgroundColor: '#1f2937', 
        color: 'white',
        padding: '1rem'
      }}>
        <h2 style={{ marginBottom: '2rem', color: 'white' }}>
          Social Sentiment
        </h2>
        
        <nav>
          <div style={{ marginBottom: '1rem' }}>
            <Link 
              href="/dashboard" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                display: 'block',
                padding: '0.5rem',
                borderRadius: '4px'
              }}
            >
              📊 Dashboard
            </Link>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <Link 
              href="/pages" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                display: 'block',
                padding: '0.5rem',
                borderRadius: '4px'
              }}
            >
              📱 Pages
            </Link>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <Link 
              href="/explorer" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                display: 'block',
                padding: '0.5rem',
                borderRadius: '4px'
              }}
            >
              🔍 Explorer
            </Link>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <Link 
              href="/insights" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                display: 'block',
                padding: '0.5rem',
                borderRadius: '4px'
              }}
            >
              📈 Insights
            </Link>
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <Link 
              href="/export" 
              style={{ 
                color: 'white', 
                textDecoration: 'none',
                display: 'block',
                padding: '0.5rem',
                borderRadius: '4px'
              }}
            >
              📥 Export
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        padding: '2rem',
        backgroundColor: '#f9fafb'
      }}>
        {children}
      </div>
    </div>
  )
}

