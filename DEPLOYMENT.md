# Social Sentiment App - Deployment Guide

This guide covers deploying the Social Sentiment application to production environments.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Facebook App with appropriate permissions
- Domain name (for production)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/social_sentiment"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Facebook App
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"

# Optional: OpenAI for enhanced analysis
OPENAI_API_KEY="your-openai-api-key"
```

## Database Setup

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   ```

2. **Create Database**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE social_sentiment;
   CREATE USER your_username WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE social_sentiment TO your_username;
   \q
   ```

3. **Run Migrations**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

## Facebook App Configuration

1. **Create Facebook App**:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add Facebook Login product
   - Add Instagram Basic Display (for Instagram integration)

2. **Configure OAuth Redirect URIs**:
   - Development: `http://localhost:3000/api/auth/callback/facebook`
   - Production: `https://yourdomain.com/api/auth/callback/facebook`

3. **Required Permissions**:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_read_user_content`
   - `instagram_basic`
   - `instagram_manage_comments`

## Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set up Database**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Application**:
   - Open http://localhost:3000
   - Sign in with Facebook to test

## Production Deployment

### Option 1: Vercel (Recommended)

1. **Prepare for Deployment**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel
   ```

3. **Configure Environment Variables** in Vercel dashboard

4. **Set up Database** (use Vercel Postgres or external provider)

### Option 2: Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm ci --only=production
   
   COPY . .
   RUN npx prisma generate
   RUN npm run build
   
   EXPOSE 3000
   
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://postgres:password@db:5432/social_sentiment
         - NEXTAUTH_URL=http://localhost:3000
         - NEXTAUTH_SECRET=your-secret
         - FACEBOOK_APP_ID=your-app-id
         - FACEBOOK_APP_SECRET=your-app-secret
         - ENCRYPTION_KEY=your-encryption-key
       depends_on:
         - db
   
     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=social_sentiment
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Deploy**:
   ```bash
   docker-compose up -d
   ```

### Option 3: Traditional Server

1. **Install Node.js and PostgreSQL** on server

2. **Clone Repository**:
   ```bash
   git clone <your-repo-url>
   cd social-sentiment-app
   ```

3. **Install Dependencies**:
   ```bash
   npm ci --only=production
   ```

4. **Set up Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

5. **Build Application**:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   ```

6. **Set up Process Manager** (PM2):
   ```bash
   npm install -g pm2
   pm2 start npm --name "social-sentiment" -- start
   pm2 startup
   pm2 save
   ```

7. **Configure Reverse Proxy** (Nginx):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Background Jobs

The application uses a database-backed job queue for processing. In production, you should run the job processor:

```bash
# Create a separate process for job processing
node -e "
const { JobQueue } = require('./src/lib/queue');
const queue = new JobQueue();
queue.startProcessing();
console.log('Job processor started');
"
```

Or use PM2:
```bash
pm2 start --name "job-processor" -- node -e "const { JobQueue } = require('./src/lib/queue'); const queue = new JobQueue(); queue.startProcessing();"
```

## Monitoring and Maintenance

### Health Checks

Create a health check endpoint:
```bash
curl http://localhost:3000/api/health
```

### Database Maintenance

1. **Regular Backups**:
   ```bash
   pg_dump social_sentiment > backup_$(date +%Y%m%d).sql
   ```

2. **Clean Old Data**:
   ```sql
   -- Delete old jobs (older than 30 days)
   DELETE FROM "Job" WHERE "createdAt" < NOW() - INTERVAL '30 days';
   
   -- Archive old comments (optional)
   -- Implement based on your retention policy
   ```

### Log Management

Configure log rotation and monitoring:
```bash
# PM2 logs
pm2 logs social-sentiment

# System logs
tail -f /var/log/nginx/access.log
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Database Security**: Use strong passwords and restrict access
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Token Encryption**: Ensure encryption keys are secure
6. **Regular Updates**: Keep dependencies updated

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Check DATABASE_URL format
   - Verify database is running
   - Check network connectivity

2. **Facebook API Errors**:
   - Verify app permissions
   - Check token expiration
   - Validate redirect URIs

3. **Build Errors**:
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

### Performance Optimization

1. **Database Indexing**:
   ```sql
   CREATE INDEX idx_comments_created_time ON "Comment"("createdTime");
   CREATE INDEX idx_analysis_sentiment ON "Analysis"("sentimentLabel");
   ```

2. **Caching**: Implement Redis for session storage and caching

3. **CDN**: Use CDN for static assets

## Scaling

For high-traffic deployments:

1. **Horizontal Scaling**: Deploy multiple app instances behind a load balancer
2. **Database Scaling**: Use read replicas for analytics queries
3. **Job Queue Scaling**: Run multiple job processors
4. **Caching Layer**: Implement Redis for frequently accessed data

## Support

For deployment issues:
1. Check application logs
2. Verify environment configuration
3. Test database connectivity
4. Validate Facebook app setup
5. Review network and firewall settings

