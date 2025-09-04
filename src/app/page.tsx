// src/app/page.tsx - Updated for NextAuth v5
import { signIn } from "@/auth"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Social Sentiment Analytics
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Harness the power of AI to analyze sentiment across your social media platforms. 
            Get deep insights into how your audience feels about your content.
          </p>
          
          {/* CTA Button */}
          <form
            action={async () => {
              "use server"
              await signIn("facebook-business", { redirectTo: "/dashboard" })
            }}
          >
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              🔗 Get Started with Facebook
            </button>
          </form>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-3">Comment Analysis</h3>
            <p className="text-blue-100">
              Automatically analyze sentiment in comments across Facebook and Instagram posts.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-semibold mb-3">Real-time Insights</h3>
            <p className="text-blue-100">
              Get instant sentiment analysis with detailed breakdowns of positive, negative, and neutral feedback.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-3">Data Visualization</h3>
            <p className="text-blue-100">
              Beautiful charts and graphs help you visualize sentiment trends over time.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-6">
            Connect your Facebook account to begin analyzing your social media sentiment
          </p>
          
          <form
            action={async () => {
              "use server"
              await signIn("facebook", { redirectTo: "/dashboard" })
            }}
          >
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              🔗 Connect Facebook Account
            </button>
          </form>
          
          <p className="text-sm text-blue-200 mt-4">
            We only access your pages and their public comments. Your data is secure and private.
          </p>
        </div>
      </div>
    </div>
  )
}

