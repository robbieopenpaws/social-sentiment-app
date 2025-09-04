'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function TestPage() {
  const { data: session } = useSession()
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const runTest = async (testName: string, url: string) => {
    if (!session?.accessToken) {
      alert('No access token found. Please log in with Facebook first.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${url}?access_token=${session.accessToken}`)
      const data = await response.json()
      
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: response.ok,
          data: data,
          status: response.status
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message,
          status: 'error'
        }
      }))
    }
    setLoading(false)
  }

  const runAllTests = async () => {
    await runTest('profile', 'https://graph.facebook.com/me')
    await runTest('pages', 'https://graph.facebook.com/me/accounts')
  }

  if (!session) {
    return <div className="p-8">Please log in with Facebook first.</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Facebook API Tests</h1>
      
      <div className="mb-6">
        <button 
          onClick={runAllTests}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Running Tests...' : 'Run All API Tests'}
        </button>
      </div>

      <div className="space-y-4">
        <button 
          onClick={() => runTest('profile', 'https://graph.facebook.com/me')}
          disabled={loading}
          className="block w-full text-left p-4 border rounded-lg hover:bg-gray-50"
        >
          Test 1: Basic Profile
        </button>
        
        <button 
          onClick={() => runTest('pages', 'https://graph.facebook.com/me/accounts')}
          disabled={loading}
          className="block w-full text-left p-4 border rounded-lg hover:bg-gray-50"
        >
          Test 2: Pages List
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Test Results</h2>
          {Object.entries(results).map(([testName, result]: [string, any]) => (
            <div key={testName} className="mb-4 p-4 border rounded-lg">
              <h3 className="font-bold text-lg capitalize">{testName}</h3>
              <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                Status: {result.success ? 'SUCCESS' : 'FAILED'} ({result.status})
              </p>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
