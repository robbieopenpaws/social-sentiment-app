// types/next-auth.d.ts
import { DefaultSession, DefaultJWT } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string
    refreshToken?: string
    expiresAt?: number
  }
}

