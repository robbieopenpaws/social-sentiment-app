// src/lib/meta.ts
import crypto from 'crypto'

// Types for Meta API responses
export interface FacebookPage {
  id: string
  name: string
  access_token: string
  picture?: {
    data: {
      url: string
    }
  }
}

export interface InstagramAccount {
  id: string
  username: string
}

export interface FacebookPost {
  id: string
  message?: string
  created_time: string
  permalink_url?: string
  likes?: {
    summary: {
      total_count: number
    }
  }
  comments?: {
    summary: {
      total_count: number
    }
  }
}

export interface InstagramPost {
  id: string
  caption?: string
  timestamp: string
  permalink?: string
  like_count?: number
  comments_count?: number
}

export interface FacebookComment {
  id: string
  from?: {
    id: string
    name: string
  }
  message: string
  created_time: string
  like_count: number
  parent?: {
    id: string
  }
}

export interface InstagramComment {
  id: string
  text: string
  timestamp: string
  username: string
  like_count: number
}

export interface PaginatedResponse<T> {
  data: T[]
  paging?: {
    cursors?: {
      before: string
      after: string
    }
    next?: string
    previous?: string
  }
}

// Rate limiter class
class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly timeWindow: number

  constructor(maxRequests: number = 200, timeWindow: number = 3600000) { // 200 requests per hour
    this.maxRequests = maxRequests
    this.timeWindow = timeWindow
  }

  async checkLimit(): Promise<void> {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.timeWindow)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.timeWindow - (now - oldestRequest)
      await this.sleep(waitTime)
    }

    this.requests.push(now)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Token encryption utilities
export class TokenEncryption {
  private static readonly algorithm = 'aes-256-gcm'
  private static readonly keyLength = 32

  static encrypt(text: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipher(this.algorithm, key)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  }

  static decrypt(encryptedText: string): string {
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
    const parts = encryptedText.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipher(this.algorithm, key)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }
}

// Main Meta API client
export class MetaGraphAPI {
  private static readonly BASE_URL = 'https://graph.facebook.com/v18.0'
  private rateLimiter = new RateLimiter()

  constructor(private accessToken: string) {}

  // Generic API request with retry logic
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string | number | boolean> = {},
    maxRetries: number = 3
  ): Promise<T> {
    await this.rateLimiter.checkLimit()

    const url = new URL(`${MetaGraphAPI.BASE_URL}${endpoint}`)
    url.searchParams.append('access_token', this.accessToken)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString())
        
        if (response.status === 429) {
          // Rate limited - exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
          await this.sleep(delay)
          continue
        }

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Meta API Error: ${error.error?.message || response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error
        }
        
        // Exponential backoff for other errors
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000)
        await this.sleep(delay)
      }
    }

    throw new Error('Max retries exceeded')
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Token management
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
    const response = await this.makeRequest<{access_token: string}>('/oauth/access_token', {
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      fb_exchange_token: shortLivedToken
    })

    return response.access_token
  }

  async getPageAccessTokens(): Promise<FacebookPage[]> {
    const response = await this.makeRequest<PaginatedResponse<FacebookPage>>('/me/accounts', {
      fields: 'id,name,access_token,picture'
    })

    return response.data
  }

  // Facebook Pages API
  async getPagePosts(
    pageId: string,
    pageToken: string,
    since?: string,
    until?: string,
    limit: number = 25
  ): Promise<FacebookPost[]> {
    const api = new MetaGraphAPI(pageToken)
    const posts: FacebookPost[] = []
    let nextUrl: string | undefined

    do {
      const params: Record<string, string | number> = {
        fields: 'id,message,created_time,permalink_url,likes.summary(true),comments.summary(true)',
        limit
      }

      if (since) params.since = since
      if (until) params.until = until

      const response = await api.makeRequest<PaginatedResponse<FacebookPost>>(
        `/${pageId}/posts`,
        params
      )

      posts.push(...response.data)
      nextUrl = response.paging?.next
    } while (nextUrl && posts.length < 1000) // Safety limit

    return posts
  }

  async getPostComments(
    postId: string,
    pageToken: string,
    limit: number = 100
  ): Promise<FacebookComment[]> {
    const api = new MetaGraphAPI(pageToken)
    const comments: FacebookComment[] = []
    let nextUrl: string | undefined

    do {
      const response = await api.makeRequest<PaginatedResponse<FacebookComment>>(
        `/${postId}/comments`,
        {
          fields: 'id,from,message,created_time,like_count,parent',
          filter: 'stream',
          limit
        }
      )

      comments.push(...response.data)
      nextUrl = response.paging?.next
    } while (nextUrl && comments.length < 10000) // Safety limit

    return comments
  }

  // Instagram Business API
  async getConnectedInstagramAccount(pageId: string, pageToken: string): Promise<InstagramAccount | null> {
    try {
      const api = new MetaGraphAPI(pageToken)
      const response = await api.makeRequest<{connected_instagram_account?: InstagramAccount}>(
        `/${pageId}`,
        {
          fields: 'connected_instagram_account'
        }
      )

      return response.connected_instagram_account || null
    } catch (error) {
      console.warn('No Instagram account connected:', error)
      return null
    }
  }

  async getInstagramPosts(
    igUserId: string,
    pageToken: string,
    since?: string,
    until?: string,
    limit: number = 25
  ): Promise<InstagramPost[]> {
    const api = new MetaGraphAPI(pageToken)
    const posts: InstagramPost[] = []
    let nextUrl: string | undefined

    do {
      const params: Record<string, string | number> = {
        fields: 'id,caption,timestamp,permalink,like_count,comments_count',
        limit
      }

      if (since) params.since = since
      if (until) params.until = until

      const response = await api.makeRequest<PaginatedResponse<InstagramPost>>(
        `/${igUserId}/media`,
        params
      )

      posts.push(...response.data)
      nextUrl = response.paging?.next
    } while (nextUrl && posts.length < 1000) // Safety limit

    return posts
  }

  async getInstagramComments(
    mediaId: string,
    pageToken: string,
    limit: number = 100
  ): Promise<InstagramComment[]> {
    const api = new MetaGraphAPI(pageToken)
    const comments: InstagramComment[] = []
    let nextUrl: string | undefined

    do {
      const response = await api.makeRequest<PaginatedResponse<InstagramComment>>(
        `/${mediaId}/comments`,
        {
          fields: 'id,text,timestamp,username,like_count',
          limit
        }
      )

      comments.push(...response.data)
      nextUrl = response.paging?.next
    } while (nextUrl && comments.length < 10000) // Safety limit

    return comments
  }

  // Token validation
  async validateToken(): Promise<boolean> {
    try {
      await this.makeRequest('/me', { fields: 'id' })
      return true
    } catch (error) {
      return false
    }
  }

  // Debug token info
  async getTokenInfo(): Promise<{
    data: {
      app_id: string
      type: string
      application: string
      data_access_expires_at: number
      expires_at: number
      is_valid: boolean
      scopes: string[]
      user_id: string
    }
  }> {
    return await this.makeRequest('/debug_token', {
      input_token: this.accessToken
    })
  }
}

