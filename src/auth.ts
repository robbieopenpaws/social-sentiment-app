// auth.ts - NextAuth v5 configuration
import NextAuth from "next-auth"
import Facebook from "next-auth/providers/facebook"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Facebook({
      clientId: process.env.FACEBOOK_APP_ID!,
      clientSecret: process.env.FACEBOOK_APP_SECRET!,
      authorization: {
        params: {
          scope: "email,public_profile"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client by returning a new object
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

