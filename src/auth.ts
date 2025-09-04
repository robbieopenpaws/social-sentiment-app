// auth.ts - NextAuth v5 configuration
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    {
      id: "facebook-business",
      name: "Facebook Business",
      type: "oauth",
      authorization: {
        url: "https://www.facebook.com/v19.0/dialog/oauth",
        params: {
          config_id: "2124466384625774",
          response_type: "code"
        }
      },
      token: "https://graph.facebook.com/v19.0/oauth/access_token",
      userinfo: {
        url: "https://graph.facebook.com/me",
        params: {
          fields: "id,name,email"
        }
      },
      clientId: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: `https://graph.facebook.com/${profile.id}/picture?type=large`
        }
      }
    }
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
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
  }
})
