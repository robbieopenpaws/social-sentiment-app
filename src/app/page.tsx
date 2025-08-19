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
  Users, 
  Facebook,
  Shield,
  Zap
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Social Sentiment Analytics
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Harness the power of AI to analyze sentiment across your social media platforms. 
            Get deep insights into how your audience feels about your content.
          </p>
          <Button 
            onClick={() => signIn('facebook')}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <Facebook className="h-5 w-5 mr-2" />
            Get Started with Facebook
          </Button>
        </div>

        {/* Features */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                Comment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automatically analyze sentiment in comments across Facebook and Instagram posts. 
                Understand what your audience really thinks.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
                Real-time Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get instant sentiment analysis with detailed breakdowns of positive, 
                negative, and neutral feedback on your content.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                Data Visualization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Beautiful charts and graphs help you visualize sentiment trends 
                and track changes over time.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-orange-600" />
                Multi-Platform
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect multiple Facebook Pages and Instagram Business accounts 
                to analyze all your social media in one place.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-red-600" />
                Toxicity Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Advanced AI models detect toxic comments and harmful content, 
                helping you maintain a positive community.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-600" />
                Export & Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Export your data in multiple formats (CSV, JSON, Excel) and 
                generate comprehensive reports for stakeholders.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
              <CardDescription className="text-lg">
                Connect your Facebook account to begin analyzing your social media sentiment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => signIn('facebook')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                <Facebook className="h-5 w-5 mr-2" />
                Connect Facebook Account
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                We only access your pages and their public comments. Your data is secure and private.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

