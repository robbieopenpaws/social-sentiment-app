# Social Media Sentiment Analysis App - Architecture

## High-Level Architecture Diagram & Flow

### System Overview
```
User → OAuth Flow → Token Exchange → Page Selection → Fetch Jobs → Analysis → Database → UI → Export
```

### Detailed Architecture Flow

#### 1. Authentication & Authorization Flow
```
User Browser → NextAuth → Facebook OAuth → Short-lived Token → Long-lived Token → Page Access Tokens
     ↓
Database (encrypted token storage)
```

#### 2. Data Collection Flow
```
User Interface → Fetch Request → Job Queue → Meta Graph API
     ↓                              ↓
Database ← Background Worker ← API Response (Posts/Comments)
```

#### 3. Analysis Pipeline
```
Raw Comments → Sentiment Analysis Engine → Toxicity Detection → Database Storage
     ↓                    ↓                      ↓
Local ML Models    External APIs (optional)    Analysis Results
```

#### 4. Data Presentation Flow
```
Database → API Routes → React Components → Charts/Tables → CSV Export
     ↓           ↓            ↓              ↓
Prisma ORM   Next.js API   shadcn/ui    Recharts
```

### Component Architecture

#### Frontend Layer (Next.js 14 App Router)
- **Authentication**: NextAuth.js with Facebook provider
- **UI Components**: shadcn/ui with TailwindCSS
- **State Management**: React hooks and server components
- **Charts**: Recharts for data visualization
- **Routing**: App Router with TypeScript

#### Backend Layer (Next.js API Routes)
- **API Routes**: RESTful endpoints for data operations
- **Authentication**: Session management and token refresh
- **Job Processing**: Background queue with retry logic
- **Rate Limiting**: Meta API compliance and backoff strategies

#### Data Layer
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: In-memory caching for frequently accessed data
- **Encryption**: Token encryption at rest
- **Migrations**: Prisma schema migrations

#### External Integrations
- **Meta Graph API**: Facebook Pages and Instagram Business
- **Sentiment Analysis**: Local transformers + optional external APIs
- **File Export**: CSV generation and download

### Security Architecture

#### Data Protection
- Environment variable management for secrets
- Token encryption using AES-256
- Server-side only API calls (no client-side token exposure)
- HTTPS enforcement for all communications

#### Privacy Compliance
- GDPR-friendly data retention policies
- Data deletion endpoints
- PII handling best practices
- Audit logging for data access

### Scalability Considerations

#### Performance Optimization
- Database indexing strategy
- Connection pooling
- Background job processing
- Pagination for large datasets

#### Monitoring & Reliability
- Error handling and retry mechanisms
- Rate limit compliance
- Job queue monitoring
- Health check endpoints

## Technology Stack Rationale

### Frontend: Next.js 14 with App Router
- **Server Components**: Improved performance and SEO
- **TypeScript**: Type safety and developer experience
- **TailwindCSS**: Rapid UI development
- **shadcn/ui**: Consistent, accessible components

### Backend: Next.js API Routes
- **Unified Codebase**: Single deployment unit
- **Serverless Ready**: Easy deployment to Vercel/similar
- **TypeScript**: End-to-end type safety

### Database: PostgreSQL with Prisma
- **Relational Data**: Complex relationships between entities
- **Type Safety**: Generated TypeScript types
- **Migration Management**: Schema versioning
- **Performance**: Optimized queries and indexing

### Analysis Engine: Pluggable Architecture
- **Local Processing**: @xenova/transformers for privacy
- **External APIs**: OpenAI/Azure for advanced analysis
- **Multi-language**: Support for global content
- **Extensible**: Easy to add new analysis types

