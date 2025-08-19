import type { Metadata } from 'next'
import AuthProvider from '@/components/providers/auth-provider'

export const metadata: Metadata = {
  title: 'Social Sentiment Analytics',
  description: 'AI-powered social media sentiment analysis platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

