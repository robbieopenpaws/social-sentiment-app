'use client'

import { useState } from 'react'

interface SentimentData {
  positive: number
  neutral: number
  negative: number
}

interface AnalysisResult {
  postId: string
  caption: string
  likes: number
  comments: number
  engagement: string
  sentiment: SentimentData
}

export default function InstagramExplorer(): JSX.Element {
  const [instagramUrl, setInstagramUrl] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string>('')

  const analyzeInstagramPost = async (): Promise<void> => {
    if (!instagramUrl) {
      setError('Please enter an Instagram URL')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      // Simulate Instagram API call with demo data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setResult({
        postId: 'demo_post_123',
        caption: 'Check out this amazing plant-based meal! 🌱 #vegan #healthy',
        likes: 245,
        comments: 18,
        engagement: '12.5%',
        sentiment: {
          positive: 85,
          neutral: 10,
          negative: 5
        }
      })
    } catch (err) {
      setError('Failed to analyze Instagram post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1024px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
          Instagram Content Explorer
        </h1>
        <p style={{ color: '#6b7280' }}>
          Analyze Instagram posts and comments for sentiment insights
        </p>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
        padding: '24px', 
        marginBottom: '24px' 
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
          Analyze Instagram Post
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '8px' 
            }}>
              Instagram Post URL
            </label>
            <input
              type="url"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          <button
            onClick={analyzeInstagramPost}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              padding: '8px 24px',
              borderRadius: '6px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze Post'}
          </button>
          
          {error && (
            <div style={{ color: '#dc2626', fontSize: '14px' }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
          padding: '24px' 
        }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            Analysis Results
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '24px' 
          }}>
            <div>
              <h4 style={{ fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                Post Details
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <p><span style={{ fontWeight: '500' }}>Post ID:</span> {result.postId}</p>
                <p><span style={{ fontWeight: '500' }}>Caption:</span> {result.caption}</p>
                <p><span style={{ fontWeight: '500' }}>Likes:</span> {result.likes}</p>
                <p><span style={{ fontWeight: '500' }}>Comments:</span> {result.comments}</p>
                <p><span style={{ fontWeight: '500' }}>Engagement Rate:</span> {result.engagement}</p>
              </div>
            </div>
            
            <div>
              <h4 style={{ fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
                Sentiment Analysis
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', width: '80px' }}>Positive:</span>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '9999px', 
                    height: '8px', 
                    marginLeft: '8px' 
                  }}>
                    <div 
                      style={{
                        backgroundColor: '#10b981',
                        height: '8px',
                        borderRadius: '9999px',
                        width: `${result.sentiment.positive}%`
                      }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '14px', marginLeft: '8px' }}>{result.sentiment.positive}%</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', width: '80px' }}>Neutral:</span>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '9999px', 
                    height: '8px', 
                    marginLeft: '8px' 
                  }}>
                    <div 
                      style={{
                        backgroundColor: '#eab308',
                        height: '8px',
                        borderRadius: '9999px',
                        width: `${result.sentiment.neutral}%`
                      }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '14px', marginLeft: '8px' }}>{result.sentiment.neutral}%</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', width: '80px' }}>Negative:</span>
                  <div style={{ 
                    flex: 1, 
                    backgroundColor: '#e5e7eb', 
                    borderRadius: '9999px', 
                    height: '8px', 
                    marginLeft: '8px' 
                  }}>
                    <div 
                      style={{
                        backgroundColor: '#ef4444',
                        height: '8px',
                        borderRadius: '9999px',
                        width: `${result.sentiment.negative}%`
                      }}
                    ></div>
                  </div>
                  <span style={{ fontSize: '14px', marginLeft: '8px' }}>{result.sentiment.negative}%</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px',
            border: '1px solid #0ea5e9'
          }}>
            <p style={{ fontSize: '14px', color: '#0c4a6e', textAlign: 'center', margin: 0 }}>
              🚀 Demo Mode: This is a working prototype with sample data. Real Instagram API integration coming soon!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

