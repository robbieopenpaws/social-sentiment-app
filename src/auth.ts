// auth.ts - NextAuth v5 configuration (No Database)
import NextAuth from "next-auth"
import Facebook from "next-auth/providers/facebook"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Facebook({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      authorization: {
        params: {
          scope: "email,public_profile,pages_show_list"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      const result = { 
        ...session,
        accessToken: undefined as string | undefined,
        refreshToken: undefined as string | undefined,
        expiresAt: undefined as number | undefined
      }
      
      if (token.accessToken) {
        result.accessToken = token.accessToken as string
      }
      if (token.refreshToken) {
        result.refreshToken = token.refreshToken as string
      }
      if (token.expiresAt) {
        result.expiresAt = token.expiresAt as number
      }
      
      return result
    }
  },
  session: {
    strategy: "jwt",
  }
})
