import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    {
      id: "facebook-business",
      name: "Facebook Business",
      type: "oauth",
      authorization: {
        url: "https://www.facebook.com/v19.0/dialog/oauth",
        params: {
          config_id: "2124466384625774", // Your Configuration ID
          response_type: "code",
          override_default_response_type: "true"
        }
      },
      token: "https://graph.facebook.com/v19.0/oauth/access_token",
      userinfo: "https://graph.facebook.com/me?fields=id,name,email",
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
      return {
        ...session,
        accessToken: token.accessToken as string,
        refreshToken: token.refreshToken as string,
        expiresAt: token.expiresAt as number
      }
    }
  }
})
