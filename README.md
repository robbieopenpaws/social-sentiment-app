# Social Sentiment - AI-Powered Social Media Analysis

A production-grade Next.js application that connects to Meta Graph API to fetch social media comments, perform sentiment analysis, and provide comprehensive data exploration with CSV export functionality.

![Social Sentiment Dashboard](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=Social+Sentiment+Dashboard)

## 🚀 Features

### Core Functionality
- **Multi-Platform Integration**: Connect Facebook Pages and Instagram Business accounts
- **Real-time Sentiment Analysis**: AI-powered sentiment detection (positive, negative, neutral)
- **Toxicity Detection**: Identify harmful or toxic content in comments
- **Keyword Extraction**: Automatically extract key topics and themes
- **Multi-language Support**: Analyze comments in multiple languages

### Data Visualization
- **Interactive Dashboards**: Beautiful charts and graphs using Recharts
- **Sentiment Trends**: Track sentiment changes over time
- **Engagement Analytics**: Analyze likes, comments, and engagement patterns
- **Page Comparison**: Compare performance across different pages
- **Toxicity Monitoring**: Track and visualize toxicity levels

### Data Management
- **Advanced Filtering**: Filter by platform, sentiment, date range, and more
- **Export Capabilities**: Export data in CSV, JSON, and Excel formats
- **Customizable Fields**: Choose which data fields to include in exports
- **Historical Data**: Maintain complete history of all analyzed content

### Technical Features
- **Background Job Processing**: Efficient queue system for data fetching and analysis
- **Rate Limit Handling**: Automatic handling of API rate limits
- **Token Management**: Secure encryption and refresh of access tokens
- **Scalable Architecture**: Built for high-volume data processing

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide Icons, Recharts
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js with Facebook OAuth
- **Job Queue**: Database-backed job processing system
- **AI/ML**: Local sentiment analysis with optional OpenAI integration

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Database      │
│   Dashboard     │◄──►│   Job Queue     │◄──►│   PostgreSQL    │
│   Components    │    │   Auth System   │    │   Prisma ORM    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Meta Graph    │    │   Sentiment     │    │   Background    │
│   API Client    │    │   Analysis      │    │   Workers       │
│   Token Mgmt    │    │   Engine        │    │   Job Processor │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Facebook Developer Account

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd social-sentiment-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/social_sentiment"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Facebook App
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# Encryption (32 characters)
ENCRYPTION_KEY="your-32-character-encryption-key"

# Optional: OpenAI for enhanced analysis
OPENAI_API_KEY="your-openai-api-key"
```

### Facebook App Setup

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com/)
2. Add Facebook Login product
3. Configure OAuth redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/facebook`
   - Production: `https://yourdomain.com/api/auth/callback/facebook`
4. Request the following permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_read_user_content`
   - `instagram_basic`
   - `instagram_manage_comments`

## 📊 Usage

### Connecting Pages

1. **Sign in** with your Facebook account
2. **Navigate** to the Pages section
3. **Click** "Connect Pages" to authorize access
4. **Select** which pages to analyze

### Analyzing Comments

1. **Automatic Fetching**: Comments are fetched automatically from connected pages
2. **Manual Trigger**: Use the "Fetch Recent Data" button for immediate updates
3. **Background Processing**: Analysis runs in the background via job queue

### Viewing Insights

1. **Dashboard**: Overview of all your data and recent activity
2. **Explorer**: Search and filter individual comments
3. **Insights**: Detailed analytics with charts and visualizations
4. **Export**: Download data in various formats

### Data Export

1. **Navigate** to the Export section
2. **Configure** export settings (format, date range, fields)
3. **Apply filters** to narrow down data
4. **Download** your customized export

## 🔧 API Reference

### Authentication
All API endpoints require authentication via NextAuth.js session.

### Core Endpoints

#### Dashboard Stats
```http
GET /api/dashboard/stats
```
Returns overview statistics for the authenticated user.

#### Pages Management
```http
GET /api/pages
POST /api/pages
PATCH /api/pages/[id]
DELETE /api/pages/[id]
```

#### Comments and Analysis
```http
GET /api/comments?page=1&limit=20&sentiment=POSITIVE
GET /api/insights?timeRange=30d&pageId=123
```

#### Data Export
```http
GET /api/export?format=csv&dataType=comments&dateFrom=2024-01-01
```

#### Job Management
```http
POST /api/fetch
GET /api/jobs/status
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Test Coverage
```bash
npm run test:coverage
```

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy Options

#### Vercel (Recommended)
```bash
npm run build
npx vercel
```

#### Docker
```bash
docker-compose up -d
```

## 🔒 Security

### Data Protection
- **Encryption**: All access tokens are encrypted at rest
- **HTTPS**: All production traffic uses HTTPS
- **Authentication**: Secure OAuth flow with Facebook
- **Rate Limiting**: API rate limiting to prevent abuse

### Privacy Compliance
- **GDPR Ready**: Built with privacy regulations in mind
- **Data Retention**: Configurable data retention policies
- **User Control**: Users can delete their data at any time

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Prettier for code formatting
- Write tests for new features
- Update documentation as needed

## 📈 Performance

### Optimization Features
- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Redis caching for frequently accessed data
- **Background Processing**: Non-blocking job queue system
- **Pagination**: Efficient data loading with pagination
- **Code Splitting**: Optimized bundle sizes with Next.js

### Monitoring
- **Health Checks**: Built-in health monitoring endpoints
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Database and API performance tracking

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U username -d social_sentiment
```

#### Facebook API Issues
- Verify app permissions in Facebook Developer Console
- Check token expiration dates
- Validate redirect URIs match exactly

#### Build Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

## 📚 Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Setup Instructions](./SETUP.md)
- [API Documentation](./docs/api.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Meta Graph API** for social media data access
- **OpenAI** for advanced sentiment analysis capabilities
- **Vercel** for hosting and deployment platform
- **shadcn/ui** for beautiful UI components
- **Prisma** for database management
- **NextAuth.js** for authentication

## 📞 Support

- **Documentation**: Check the docs folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join community discussions
- **Email**: Contact support at support@socialment.com

---

**Built with ❤️ by the Social Sentiment Team**
