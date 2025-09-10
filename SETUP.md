# Setup & App Review Notes

## Environment Configuration

### Required Environment Variables (.env.local)

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Facebook App Configuration
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/social_sentiment

# Encryption Key for Token Storage
ENCRYPTION_KEY=your-32-character-encryption-key

# Optional External API Keys
OPENAI_API_KEY=your-openai-api-key (optional)
AZURE_API_KEY=your-azure-api-key (optional)
HUGGINGFACE_API_KEY=your-hf-api-key (optional)

# Production Settings
NODE_ENV=development
```

## Facebook App Configuration

### 1. Create Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app with "Business" type
3. Add "Facebook Login" product
4. Configure OAuth redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/facebook`
   - Production: `https://yourdomain.com/api/auth/callback/facebook`

### 2. Required Permissions
The app requires the following permissions for full functionality:

#### Facebook Pages Permissions
- `pages_read_engagement` - Read post engagement data
- `pages_read_user_content` - Read posts and comments
- `pages_show_list` - List user's pages
- `public_profile` - Basic user information
- `email` - User email address

#### Instagram Business Permissions (Optional)
- `instagram_basic` - Basic Instagram access
- `instagram_manage_comments` - Read Instagram comments
- `pages_show_list` - Required for Instagram Business accounts

### 3. App Review Checklist

#### Basic Information
- [ ] App name and description clearly explain sentiment analysis purpose
- [ ] Privacy policy URL (required for production)
- [ ] Terms of service URL
- [ ] App icon and screenshots
- [ ] Business verification (for advanced permissions)

#### Permission Justification Templates

**pages_read_engagement**
```
Our app analyzes sentiment of comments on Facebook posts to help businesses 
understand customer feedback. We need this permission to access engagement 
metrics and comment data from pages owned by the user.
```

**pages_read_user_content**
```
We require access to posts and their comments to perform sentiment analysis. 
This helps page owners understand public sentiment about their content and 
improve their social media strategy.
```

**instagram_basic & instagram_manage_comments**
```
For users with Instagram Business accounts connected to their Facebook pages, 
we analyze Instagram post comments for comprehensive social media sentiment 
analysis across both platforms.
```

#### Submission Requirements
- [ ] Detailed use case explanation
- [ ] Screen recordings showing permission usage
- [ ] Test user credentials for review team
- [ ] Data usage and retention policy
- [ ] GDPR compliance documentation

## Token Management Flow

### 1. OAuth Flow Steps
```
1. User clicks "Connect Facebook" → Facebook OAuth dialog
2. User grants permissions → Authorization code returned
3. Exchange code for short-lived user token (1 hour)
4. Exchange short-lived for long-lived user token (60 days)
5. Use user token to get page access tokens (no expiration)
6. Store encrypted page tokens in database
```

### 2. Token Refresh Strategy
```javascript
// Pseudo-code for token refresh
async function refreshTokens() {
  const expiredTokens = await getExpiringTokens();
  for (const token of expiredTokens) {
    try {
      const newToken = await exchangeForLongLivedToken(token);
      await updateEncryptedToken(token.id, newToken);
    } catch (error) {
      await markTokenAsInvalid(token.id);
      // Notify user to re-authenticate
    }
  }
}
```

## Local Development Setup

### 1. Prerequisites
```bash
# Install Node.js 18+ and npm
node --version  # Should be 18+
npm --version

# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql postgresql-contrib
# Windows: Download from postgresql.org
```

### 2. Database Setup
```bash
# Create database
createdb social_sentiment

# Or using psql
psql -U postgres
CREATE DATABASE social_sentiment;
\q
```

### 3. Project Installation
```bash
# Clone and install dependencies
git clone <repository-url>
cd social-sentiment-app
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
npx prisma migrate dev
npx prisma generate

# Seed database (optional)
npm run seed
```

### 4. Development Commands
```bash
# Start development server
npm run dev

# Run database studio
npx prisma studio

# Run tests
npm test

# Build for production
npm run build
```

## Production Deployment

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# Configure PostgreSQL connection (recommend Supabase or Railway)
```

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Environment Variables for Production
- Set all environment variables in your deployment platform
- Use managed PostgreSQL service (Supabase, Railway, etc.)
- Configure proper NEXTAUTH_URL for your domain
- Set up SSL certificates for HTTPS

## Rate Limiting & API Compliance

### Meta API Rate Limits
- **Facebook Pages**: 200 calls per hour per user
- **Instagram Basic Display**: 200 calls per hour per user
- **Graph API**: Application-level limits apply

### Implementation Strategy
```javascript
// Rate limiting with exponential backoff
const rateLimiter = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  
  async makeRequest(apiCall) {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.code === 429) {
          const delay = Math.min(
            this.baseDelay * Math.pow(2, attempt),
            this.maxDelay
          );
          await sleep(delay);
          continue;
        }
        throw error;
      }
    }
  }
};
```

## Security Considerations

### Token Security
- All tokens encrypted at rest using AES-256
- No tokens exposed to client-side code
- Regular token rotation and validation
- Secure token transmission over HTTPS only

### Data Privacy
- Implement data retention policies
- Provide user data deletion endpoints
- Log access for audit purposes
- Comply with GDPR and similar regulations

### API Security
- Input validation on all endpoints
- Rate limiting on API routes
- CSRF protection via NextAuth
- Secure headers and CORS configuration

