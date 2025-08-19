'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

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

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        textAlign: 'center',
        color: 'white'
      }}>
        {/* Header */}
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem' 
        }}>
          Social Sentiment Analytics
        </h1>
        
        <p style={{ 
          fontSize: '1.2rem', 
          marginBottom: '3rem',
          opacity: 0.9
        }}>
          Harness the power of AI to analyze sentiment across your social media platforms. 
          Get deep insights into how your audience feels about your content.
        </p>

        {/* Login Button */}
        <button 
          onClick={() => signIn('facebook')}
          style={{
            backgroundColor: '#1877f2',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '3rem'
          }}
        >
          🔗 Get Started with Facebook
        </button>

        {/* Features */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          marginTop: '3rem'
        }}>
          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            padding: '1.5rem', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ marginBottom: '1rem' }}>💬 Comment Analysis</h3>
            <p style={{ opacity: 0.9 }}>
              Automatically analyze sentiment in comments across Facebook and Instagram posts.
            </p>
          </div>

          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            padding: '1.5rem', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ marginBottom: '1rem' }}>📈 Real-time Insights</h3>
            <p style={{ opacity: 0.9 }}>
              Get instant sentiment analysis with detailed breakdowns of positive, negative, and neutral feedback.
            </p>
          </div>

          <div style={{ 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            padding: '1.5rem', 
            borderRadius: '8px' 
          }}>
            <h3 style={{ marginBottom: '1rem' }}>📊 Data Visualization</h3>
            <p style={{ opacity: 0.9 }}>
              Beautiful charts and graphs help you visualize sentiment trends over time.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div style={{ 
          marginTop: '3rem',
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '2rem',
          borderRadius: '12px'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Ready to Get Started?</h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
            Connect your Facebook account to begin analyzing your social media sentiment
          </p>
          <button 
            onClick={() => signIn('facebook')}
            style={{
              backgroundColor: '#1877f2',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🔗 Connect Facebook Account
          </button>
          <p style={{ 
            fontSize: '0.9rem', 
            marginTop: '1rem', 
            opacity: 0.7 
          }}>
            We only access your pages and their public comments. Your data is secure and private.
          </p>
        </div>
      </div>
    </div>
  )
}

