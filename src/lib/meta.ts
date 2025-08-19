// src/lib/meta.ts
import crypto from 'crypto'

interface FacebookPage {
  id: string
  name: string
  access_token: string
  category: string
  tasks?: string[]
}

interface FacebookPost {
  id: string
  message?: string
  story?: string
  created_time: string
  updated_time: string
  permalink_url?: string
  comments?: {
    data: FacebookComment[]
    paging?: {
      cursors: {
        before: string
        after: string
      }
      next?: string
    }
  }
}

interface FacebookComment {
  id: string
  message: string
  created_time: string
  from: {
    name: string
    id: string
  }
  parent?: {
    id: string
  }
  attachment?: {
    type: string
    url: string
  }
  like_count?: number
  comment_count?: number
}

interface InstagramMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  permalink: string
  timestamp: string
  comments?: {
    data: InstagramComment[]
    paging?: {
      cursors: {
        before: string
        after: string
      }
      next?: string
    }
  }
}

interface InstagramComment {
  id: string
  text: string
  timestamp: string
  from: {
    id: string
    username: string
  }
  replies?: {
    data: InstagramComment[]
  }
  like_count?: number
}

interface TokenInfo {
  access_token: string
  token_type: string
  expires_in?: number
}

interface GraphAPIError {
  error: {
    message: string
    type: string
    code: number
    error_subcode?: number
    fbtrace_id: string
  }
}

export class MetaGraphAPI {
  private baseUrl = 'https://graph.facebook.com/v18.0'
  private encryptionKey: string

  constructor(encryptionKey?: string) {
    this.encryptionKey = encryptionKey || process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  }

  // Token encryption/decryption
  encryptToken(token: string): string {
    try {
      const algorithm = 'aes-256-cbc'
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32)
      const iv = crypto.randomBytes(16)
      
      const cipher = crypto.createCipher(algorithm, key)
      let encrypted = cipher.update(token, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      return iv.toString('hex') + ':' + encrypted
    } catch (error) {
      console.error('Token encryption failed:', error)
      return token // Fallback to unencrypted
    }
  }

  decryptToken(encryptedToken: string): string {
    try {
      const algorithm = 'aes-256-cbc'
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32)
      
      const parts = encryptedToken.split(':')
      if (parts.length !== 2) {
        return encryptedToken // Assume it's already decrypted
      }
      
      const iv = Buffer.from(parts[0], 'hex')
      const encrypted = parts[1]
      
      const decipher = crypto.createDecipher(algorithm, key)
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Token decryption failed:', error)
      return encryptedToken // Return as-is if decryption fails
    }
  }

  // Make authenticated requests to Graph API
  private async makeRequest<T>(endpoint: string, accessToken: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/${endpoint}`)
    url.searchParams.append('access_token', accessToken)
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    try {
      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        const error = data as GraphAPIError
        throw new Error(`Graph API Error: ${error.error.message} (Code: ${error.error.code})`)
      }

      return data as T
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown API error occurred')
    }
  }

  // Get user's Facebook pages
  async getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
    try {
      const response = await this.makeRequest<{ data: FacebookPage[] }>(
        'me/accounts',
        userAccessToken,
        {
          fields: 'id,name,access_token,category,tasks'
        }
      )

      return response.data || []
    } catch (error) {
      console.error('Failed to fetch user pages:', error)
      return []
    }
  }

  // Get posts from a Facebook page
  async getPagePosts(pageAccessToken: string, pageId: string, limit = 25, since?: string): Promise<FacebookPost[]> {
    try {
      const params: Record<string, string> = {
        fields: 'id,message,story,created_time,updated_time,permalink_url',
        limit: limit.toString()
      }

      if (since) {
        params.since = since
      }

      const response = await this.makeRequest<{ data: FacebookPost[] }>(
        `${pageId}/posts`,
        pageAccessToken,
        params
      )

      return response.data || []
    } catch (error) {
      console.error('Failed to fetch page posts:', error)
      return []
    }
  }

  // Get comments from a Facebook post
  async getPostComments(pageAccessToken: string, postId: string, limit = 100): Promise<FacebookComment[]> {
    try {
      const response = await this.makeRequest<{ data: FacebookComment[] }>(
        `${postId}/comments`,
        pageAccessToken,
        {
          fields: 'id,message,created_time,from,parent,attachment,like_count,comment_count',
          limit: limit.toString(),
          order: 'chronological'
        }
      )

      return response.data || []
    } catch (error) {
      console.error('Failed to fetch post comments:', error)
      return []
    }
  }

  // Get Instagram business account
  async getInstagramAccount(pageAccessToken: string, pageId: string): Promise<{ id: string; username: string } | null> {
    try {
      const response = await this.makeRequest<{ instagram_business_account?: { id: string } }>(
        pageId,
        pageAccessToken,
        {
          fields: 'instagram_business_account'
        }
      )

      if (!response.instagram_business_account) {
        return null
      }

      const accountInfo = await this.makeRequest<{ id: string; username: string }>(
        response.instagram_business_account.id,
        pageAccessToken,
        {
          fields: 'id,username'
        }
      )

      return accountInfo
    } catch (error) {
      console.error('Failed to fetch Instagram account:', error)
      return null
    }
  }

  // Get Instagram media
  async getInstagramMedia(pageAccessToken: string, instagramAccountId: string, limit = 25): Promise<InstagramMedia[]> {
    try {
      const response = await this.makeRequest<{ data: InstagramMedia[] }>(
        `${instagramAccountId}/media`,
        pageAccessToken,
        {
          fields: 'id,caption,media_type,media_url,permalink,timestamp',
          limit: limit.toString()
        }
      )

      return response.data || []
    } catch (error) {
      console.error('Failed to fetch Instagram media:', error)
      return []
    }
  }

  // Get Instagram media comments
  async getInstagramComments(pageAccessToken: string, mediaId: string, limit = 100): Promise<InstagramComment[]> {
    try {
      const response = await this.makeRequest<{ data: InstagramComment[] }>(
        `${mediaId}/comments`,
        pageAccessToken,
        {
          fields: 'id,text,timestamp,from,replies,like_count',
          limit: limit.toString()
        }
      )

      return response.data || []
    } catch (error) {
      console.error('Failed to fetch Instagram comments:', error)
      return []
    }
  }

  // Refresh long-lived access token
  async refreshLongLivedToken(shortLivedToken: string): Promise<TokenInfo | null> {
    try {
      const url = new URL(`${this.baseUrl}/oauth/access_token`)
      url.searchParams.append('grant_type', 'fb_exchange_token')
      url.searchParams.append('client_id', process.env.FACEBOOK_APP_ID || '')
      url.searchParams.append('client_secret', process.env.FACEBOOK_APP_SECRET || '')
      url.searchParams.append('fb_exchange_token', shortLivedToken)

      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        const error = data as GraphAPIError
        throw new Error(`Token refresh failed: ${error.error.message}`)
      }

      return data as TokenInfo
    } catch (error) {
      console.error('Token refresh failed:', error)
      return null
    }
  }

  // Validate access token
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      await this.makeRequest<Record<string, unknown>>('me', accessToken, { fields: 'id' })
      return true
    } catch (error) {
      return false
    }
  }

  // Get token info (expiration, scopes, etc.)
  async getTokenInfo(accessToken: string): Promise<Record<string, unknown> | null> {
    try {
      const response = await this.makeRequest<Record<string, unknown>>(
        'debug_token',
        accessToken,
        {
          input_token: accessToken
        }
      )

      return response
    } catch (error) {
      console.error('Failed to get token info:', error)
      return null
    }
  }

  // Rate limiting helper
  async withRateLimit<T>(operation: () => Promise<T>, retries = 3): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (error instanceof Error && error.message.includes('rate limit')) {
          if (attempt === retries) throw error
          
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        throw error
      }
    }
    
    throw new Error('Max retries exceeded')
  }
}

// Factory function for creating API client
export function createMetaAPI(encryptionKey?: string): MetaGraphAPI {
  return new MetaGraphAPI(encryptionKey)
}

