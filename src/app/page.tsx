'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart3, 
  MessageSquare, 
  TrendingUp, 
  Shield, 
  Zap, 
  Users,
  Facebook,
  Instagram,
  ArrowRight
} from 'lucide-react'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Social Sentiment</h1>
            </div>
            <Button onClick={() => signIn('facebook')}>
              <Facebook className="mr-2 h-4 w-4" />
              Sign In with Facebook
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Social Media
            <span className="text-blue-600"> Sentiment Analysis</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Understand what your audience really thinks. Analyze sentiment, detect toxicity, 
            and gain actionable insights from your Facebook and Instagram comments.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => signIn('facebook')}>
              <Facebook className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
            <Button variant="outline" size="lg">
              Watch Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to understand your audience
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features to analyze, visualize, and export your social media data
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Real-time Analysis</CardTitle>
                <CardDescription>
                  Automatically analyze sentiment and toxicity in comments as they come in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Positive, negative, and neutral sentiment detection</li>
                  <li>• Toxicity and harmful content identification</li>
                  <li>• Multi-language support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Rich Visualizations</CardTitle>
                <CardDescription>
                  Beautiful charts and graphs to understand your data at a glance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Sentiment trends over time</li>
                  <li>• Engagement metrics analysis</li>
                  <li>• Keyword and topic extraction</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Export & Reporting</CardTitle>
                <CardDescription>
                  Export your data in multiple formats for further analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• CSV, JSON, and Excel exports</li>
                  <li>• Customizable data fields</li>
                  <li>• Automated report generation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Your data is encrypted and secure with enterprise-grade protection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• End-to-end encryption</li>
                  <li>• GDPR compliant</li>
                  <li>• Secure token management</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-yellow-600 mb-2" />
                <CardTitle>Fast & Scalable</CardTitle>
                <CardDescription>
                  Process thousands of comments quickly with our optimized infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Background job processing</li>
                  <li>• Rate limit handling</li>
                  <li>• Automatic retries</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-indigo-600 mb-2" />
                <CardTitle>Multi-Platform</CardTitle>
                <CardDescription>
                  Connect multiple Facebook Pages and Instagram Business accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Facebook Pages integration</li>
                  <li>• Instagram Business accounts</li>
                  <li>• Unified dashboard</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to understand your audience better?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start analyzing your social media sentiment today. No credit card required.
          </p>
          <Button size="lg" variant="secondary" onClick={() => signIn('facebook')}>
            <Facebook className="mr-2 h-5 w-5" />
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-blue-400 mr-2" />
              <span className="text-lg font-semibold">Social Sentiment</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2024 Social Sentiment. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

