// src/lib/workers/refresh-tokens.ts
import { PrismaClient } from '@prisma/client'
import { MetaGraphAPI, TokenEncryption } from '../meta'

const prisma = new PrismaClient()

export async function refreshExpiredTokens(): Promise<void> {
  try {
    console.log('Starting token refresh process')

    // Get all active pages
    const pages = await prisma.page.findMany({
      where: { isActive: true },
      include: { owner: true }
    })

    let refreshedCount = 0
    let errorCount = 0

    for (const page of pages) {
      try {
        // Decrypt current token
        const currentToken = TokenEncryption.decrypt(page.pageAccessToken)
        const api = new MetaGraphAPI(currentToken)

        // Check if token is still valid
        const isValid = await api.validateToken()
        
        if (isValid) {
          // Get token info to check expiration
          const tokenInfo = await api.getTokenInfo()
          const expiresAt = tokenInfo.data?.expires_at
          
          // If token expires within 7 days, refresh it
          if (expiresAt && expiresAt < (Date.now() / 1000) + (7 * 24 * 60 * 60)) {
            console.log(`Token for page ${page.name} expires soon, refreshing...`)
            
            // For page tokens, we need to get a fresh user token first
            // This is a simplified approach - in production, you'd need to handle this more carefully
            const longLivedToken = await api.exchangeForLongLivedToken(currentToken)
            const newApi = new MetaGraphAPI(longLivedToken)
            
            // Get fresh page tokens
            const pageTokens = await newApi.getPageAccessTokens()
            const pageToken = pageTokens.find(p => p.id === page.externalId)
            
            if (pageToken) {
              // Encrypt and store new token
              const encryptedToken = TokenEncryption.encrypt(pageToken.access_token)
              
              await prisma.page.update({
                where: { id: page.id },
                data: {
                  pageAccessToken: encryptedToken,
                  updatedAt: new Date()
                }
              })
              
              refreshedCount++
              console.log(`Successfully refreshed token for page ${page.name}`)
            }
          }
        } else {
          // Token is invalid, mark page as inactive
          console.warn(`Token for page ${page.name} is invalid, marking as inactive`)
          
          await prisma.page.update({
            where: { id: page.id },
            data: { isActive: false }
          })
          
          // TODO: Notify user that they need to re-authenticate
          errorCount++
        }
      } catch (error) {
        console.error(`Error refreshing token for page ${page.name}:`, error)
        errorCount++
      }
    }

    console.log(`Token refresh completed: ${refreshedCount} refreshed, ${errorCount} errors`)

  } catch (error) {
    console.error('Error in token refresh process:', error)
    throw error
  }
}

