# 🚀 WorkLedger - Corporate Skill Certification Platform

> Automatically track employee skills, generate verified certificates, and build comprehensive skill portfolios - all while maintaining strict data privacy.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.7-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-latest-336791)](https://www.postgresql.org/)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Database](#-database)
- [Integrations](#-integrations)
- [Development](#-development)
- [Deployment](#-deployment)
- [Security](#-security)
- [License](#-license)

## 🎯 Overview

WorkLedger is an enterprise-focused platform that helps companies automatically track employee skill development and performance through integrations with GitHub, Slack, and Jira. Generate verified digital certificates that employees can use for career advancement while maintaining strict data privacy and protecting company-sensitive information.

### Key Benefits

**For Companies:**
- Automated skill tracking from development tools
- Real-time team analytics and skill matrices
- ROI tracking for training programs
- Compliance-ready audit logging
- Granular privacy controls

**For Employees:**
- Verified, cryptographically-signed certificates
- Visual skill evolution timeline
- Comprehensive professional portfolio
- Career advancement credentials
- Privacy-first data sharing

## ✨ Features

### 🔐 Authentication & Access Control
- Secure authentication with NextAuth.js
- Role-based access (Admin, Manager, Employee)
- Session management with JWT
- Multi-user support

### 📊 Dashboard & Analytics
- Real-time skill tracking dashboard
- Team performance analytics
- Repository contribution metrics
- Activity timelines and trends
- Skill evolution visualization

### 🔗 Integrations (All Complete!)

#### GitHub Integration
- OAuth authentication for organizations
- Automatic repository synchronization
- Commit tracking and analysis
- Pull request metrics
- Language and framework detection
- Real-time webhook support

#### Slack Integration
- Workspace connection via OAuth
- Channel activity tracking
- Message analytics (privacy-focused)
- Team collaboration metrics
- User mapping to employees

#### Jira Integration
- Atlassian Cloud OAuth
- Project and issue tracking
- Worklog time analysis
- Sprint metrics
- Issue status transitions
- Comment and collaboration tracking

### 🎓 Certificate Management
- Automated certificate generation
- Cryptographically signed credentials
- QR code verification
- PDF export functionality
- Skills and achievements showcase
- Customizable templates

### 👥 Employee Management
- Comprehensive employee profiles
- Skill records with confidence levels
- Activity tracking across integrations
- Public profile pages
- Invitation system
- Department and role management

### 📦 Additional Features
- Audit logging for compliance
- Job queue for background processing
- Skill evolution tracking over time
- Repository activity monitoring
- Comprehensive seed data for development

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, Lucide Icons
- **Charts:** Recharts

### Backend
- **Runtime:** Node.js 18+
- **API:** Next.js API Routes
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **Job Queue:** Bull (Redis-based)

### Database & Cache
- **Database:** PostgreSQL
- **Cache:** Redis
- **Containerization:** Docker & Docker Compose

### Integrations
- **GitHub:** Octokit (REST & GraphQL)
- **Slack:** @slack/web-api
- **Jira:** Atlassian REST API

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm
- **Docker** and Docker Compose
- **Git**
- A code editor (VS Code recommended)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/workledger.git
cd workledger-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration (see [Configuration](#-configuration) section).

### 4. Start Docker Services

```bash
npm run docker:up
```

This starts PostgreSQL and Redis containers.

### 5. Setup Database

```bash
# Push the schema to the database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed the database with sample data
npm run db:seed
```

### 6. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 7. Login

Use the seeded credentials:

```
Email: admin@techcorp.com
Password: password123
```

Additional test users are available (see seed output).

## ⚙️ Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL="postgresql://workledger_user:workledger_pass_2024@localhost:5432/workledger_db"

# Redis
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# App Settings
NODE_ENV="development"
APP_URL="http://localhost:3000"

# Encryption (for sensitive data)
ENCRYPTION_SECRET="your-encryption-secret-min-32-chars"
```

### GitHub Integration (Optional)

To enable GitHub integration:

1. Create a GitHub OAuth App:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Set Authorization callback URL: `http://localhost:3000/api/github/callback`

2. Add to `.env`:
```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
GITHUB_APP_ID="your-github-app-id"
GITHUB_PRIVATE_KEY="your-github-private-key"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
NEXT_PUBLIC_GITHUB_APP_NAME="your-app-name"
```

### Slack Integration (Optional)

To enable Slack integration:

1. Create a Slack App at [api.slack.com/apps](https://api.slack.com/apps)
2. Add OAuth Redirect URL: `http://localhost:3000/api/slack/callback`
3. Enable required scopes

Add to `.env`:
```env
SLACK_CLIENT_ID="your-slack-client-id"
SLACK_CLIENT_SECRET="your-slack-client-secret"
SLACK_SIGNING_SECRET="your-slack-signing-secret"
```

### Jira Integration (Optional)

To enable Jira integration:

1. Create an OAuth 2.0 integration in [Atlassian Developer Console](https://developer.atlassian.com/)
2. Add callback URL: `http://localhost:3000/api/jira/callback`

Add to `.env`:
```env
JIRA_CLIENT_ID="your-jira-client-id"
JIRA_CLIENT_SECRET="your-jira-client-secret"
```

## 💾 Database

### Schema Overview

The database schema includes:

- **Companies** - Organization management and settings
- **Employees** - User profiles and roles
- **Skills** - Master skill catalog (51 predefined skills)
- **SkillRecords** - Employee skill tracking
- **Certificates** - Verified credentials
- **Repositories** - GitHub repository data
- **Commits & Pull Requests** - Code contribution tracking
- **Slack/Jira Data** - Integration-specific tables
- **Audit Logs** - Compliance and activity tracking

### Database Commands

```bash
# Push schema changes
npm run db:push

# Create a migration
npm run db:migrate

# Open Prisma Studio (GUI)
npm run db:studio

# Seed the database
npm run db:seed

# Clear all data
npm run db:clear

# Generate Prisma Client
npm run db:generate
```

### Seed Data

The seed script creates:
- 1 Company (TechCorp Solutions)
- 10 Employees with various roles
- 51 Skills across all categories
- 100+ Skill records
- 6 Repositories
- 50+ Commits
- 5 Pull requests
- 4 Certificates
- GitHub, Slack, and Jira integration data
- Sample analytics data

## 🔗 Integrations

### GitHub

**Features:**
- Repository synchronization
- Commit and PR tracking
- Language detection
- Contributor analysis
- Webhook support for real-time updates

**Setup:**
1. Navigate to Dashboard → Integrations
2. Click "Connect GitHub"
3. Authorize the application
4. Select repositories to sync

### Slack

**Features:**
- Workspace connection
- Channel activity tracking
- Message analytics
- User collaboration metrics

**Setup:**
1. Navigate to Dashboard → Integrations
2. Click "Connect Slack"
3. Authorize workspace access
4. Channels are automatically synced

### Jira

**Features:**
- Project tracking
- Issue and sprint analytics
- Worklog time tracking
- Issue transitions and history

**Setup:**
1. Navigate to Dashboard → Integrations
2. Click "Connect Jira"
3. Authorize Atlassian account
4. Projects are automatically synced

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database
npm run db:clear         # Clear all data
npm run db:generate      # Generate Prisma Client

# Docker
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:logs      # View Docker logs

# Testing
node test-webhook.js     # Test GitHub webhooks
```

### Project Structure

```
workledger-app/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed script
├── src/
│   ├── app/             # Next.js app router
│   │   ├── api/         # API routes
│   │   ├── auth/        # Authentication pages
│   │   ├── dashboard/   # Dashboard pages
│   │   └── employee/    # Employee portal
│   ├── components/      # React components
│   ├── lib/             # Utilities and config
│   └── services/        # Integration services
├── public/              # Static assets
├── .env                 # Environment variables
└── package.json         # Dependencies
```

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Follow Next.js best practices

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `NEXTAUTH_SECRET` and `ENCRYPTION_SECRET`
- [ ] Configure production database
- [ ] Set up Redis instance
- [ ] Configure proper `APP_URL` and `NEXTAUTH_URL`
- [ ] Set up SSL/TLS certificates
- [ ] Configure integration OAuth apps with production URLs
- [ ] Enable database backups
- [ ] Set up monitoring and logging
- [ ] Review security settings

### Environment-Specific Configurations

**Production:**
```env
NODE_ENV="production"
APP_URL="https://your-domain.com"
NEXTAUTH_URL="https://your-domain.com"
DATABASE_URL="postgresql://user:pass@prod-host:5432/db"
REDIS_URL="redis://prod-redis:6379"
```

**Staging:**
```env
NODE_ENV="production"
APP_URL="https://staging.your-domain.com"
NEXTAUTH_URL="https://staging.your-domain.com"
```

### Docker Deployment

Build and run with Docker:

```bash
docker-compose up -d
```

## 🔐 Security

### Data Protection

- **Encryption at Rest:** Sensitive data encrypted using AES-256-GCM
- **Encryption in Transit:** HTTPS/TLS for all communications
- **Password Security:** bcrypt hashing with salt
- **Session Management:** Secure JWT tokens with httpOnly cookies

### Privacy Controls

- Granular company settings for data sharing
- Employee consent for certificate issuance
- Audit logging for all data access
- GDPR-compliant data handling

### Access Control

- Role-based permissions (Admin, Manager, Employee)
- Session-based authentication
- API route protection
- Middleware for authorization

### Compliance

- Complete audit trail
- Data portability
- Right to deletion
- Privacy-first design

## 📊 Monitoring & Logging

### Audit Logs

All important actions are logged:
- User authentication
- Data access
- Integration connections
- Certificate issuance
- Settings changes

Access logs via Dashboard → Audit Logs

### Job Queue Monitoring

Monitor background jobs:
- GitHub sync jobs
- Skill analysis jobs
- Certificate generation jobs

View in Dashboard → Settings → Jobs

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart Docker services
npm run docker:down
npm run docker:up

# Check logs
npm run docker:logs
```

### Integration Issues

**GitHub:**
- Verify OAuth app credentials
- Check callback URL matches `.env`
- Ensure proper scopes are granted

**Slack:**
- Verify app credentials
- Check bot token permissions
- Ensure callback URL is correct

**Jira:**
- Verify Atlassian OAuth credentials
- Check API scopes
- Ensure callback URL matches

### Seed Data Issues

```bash
# Clear and reseed
npm run db:clear
npm run db:seed
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Write TypeScript with strict type checking
- Follow the existing code style
- Add comments for complex logic
- Update documentation for new features
- Test integrations thoroughly

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For questions, issues, or support:

- Open an issue on GitHub
- Check existing documentation
- Review closed issues for solutions

## 🙏 Acknowledgments

Built with these amazing technologies:

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)

---

**Built with ❤️ for the future of professional development**

*Last Updated: January 2025*
