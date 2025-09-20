# 🚀 WorkLedger - Corporate Skill Certification Platform

## Overview

WorkLedger is an enterprise-focused platform that helps companies automatically track employee skill development and performance, generating verified digital certificates that employees can use for career advancement - while maintaining strict data privacy and protecting company-sensitive information.

## 🎯 Core Features

### For Companies
- **Automated Skill Tracking**: Integration with GitHub, Jira, and other tools
- **Team Analytics**: Skill matrix, performance insights, training ROI
- **Privacy Controls**: Granular control over what data gets shared
- **Certificate Management**: Generate and manage employee certificates

### For Employees
- **Verified Certificates**: Company-verified, cryptographically signed credentials
- **Skill Timeline**: Visual representation of professional growth
- **Portfolio Builder**: Professional profile for career advancement
- **Privacy Protection**: Only approved information is shareable

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (Dockerized)
- **Cache**: Redis
- **Authentication**: NextAuth.js
- **Integrations**: GitHub API, REST APIs

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

## 🚀 Quick Start

### 1. Clone & Setup
```bash
git clone git@github.com-personalwork:Smeet23/WorkLedger.git
cd WorkLedger
npm install
```

### 2. Environment Setup
```bash
cp .env.local.example .env.local
# Edit .env.local with your configuration
```

### 3. Start Database
```bash
npm run docker:up
```

### 4. Database Setup
```bash
npm run db:push
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The platform uses a comprehensive schema designed for enterprise needs:

- **Companies**: Organization management and settings
- **Employees**: User profiles and role management
- **Skills**: Master skill catalog with categories
- **Certificates**: Verified digital credentials
- **GitHub Activities**: Automated skill tracking
- **Audit Logs**: Complete activity tracking for compliance

## 🔐 Security & Privacy

- **Data Segregation**: Strict separation of private vs shareable data
- **Encryption**: All sensitive data encrypted at rest and in transit
- **Audit Logging**: Complete tracking of data access and modifications
- **GDPR Compliance**: Built-in data portability and privacy controls

## 📝 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run docker:up    # Start Docker services
npm run docker:down  # Stop Docker services
```

## 🏗 Development Roadmap

### Phase 1: MVP (Current)
- [x] Database schema design
- [x] Basic project setup
- [ ] Authentication system
- [ ] Company onboarding
- [ ] GitHub integration
- [ ] Basic certificate generation

### Phase 2: Core Features
- [ ] Advanced analytics
- [ ] Multi-role support
- [ ] Mobile responsiveness
- [ ] API documentation

### Phase 3: Enterprise Features
- [ ] White-label options
- [ ] Advanced integrations
- [ ] Compliance features
- [ ] Performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For questions or support, please open an issue in this repository.

---

**Built with ❤️ for the future of professional development**