# DevStudio Frontend Deployment Guide

This document provides comprehensive instructions for deploying the DevStudio Frontend application across different environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Docker Deployment](#docker-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker** (v20 or higher)
- **Docker Compose** (v2 or higher)

### Optional Tools

- **Lighthouse CLI** (for performance auditing)
- **Trivy** (for security scanning)
- **kubectl** (for Kubernetes deployments)

## Environment Configuration

### Environment Files

The application supports multiple environment configurations:

- `.env.development` - Development environment
- `.env.staging` - Staging environment  
- `.env.production` - Production environment
- `.env.example` - Template for environment variables

### Required Environment Variables

```bash
# API Configuration
VITE_API_URL=https://api.devstudio.com/api
VITE_SOCKET_URL=https://api.devstudio.com
VITE_APP_NAME=DevStudio

# Environment Settings
VITE_APP_ENV=production
VITE_ENABLE_DEVTOOLS=false
VITE_LOG_LEVEL=error
VITE_ENABLE_MOCK_DATA=false

# Optional Monitoring
VITE_SENTRY_DSN=your-sentry-dsn
VITE_ANALYTICS_ID=your-analytics-id
```

## Build Process

### Development Build

```bash
npm run dev
```

### Production Builds

```bash
# Build for staging
npm run build:staging

# Build for production
npm run build:production

# Build with bundle analysis
npm run build:analyze
```

### Build Optimization Features

- **Code Splitting**: Automatic vendor and feature-based chunking
- **Tree Shaking**: Removes unused code
- **Minification**: Terser-based JavaScript and CSS minification
- **Asset Optimization**: Image compression and inlining
- **Source Maps**: Hidden source maps for production debugging

## Docker Deployment

### Building Docker Images

```bash
# Build production image
docker build -t devstudio-frontend:latest .

# Build with specific environment
docker build --build-arg BUILD_ENV=staging -t devstudio-frontend:staging .
```

### Running Containers

```bash
# Run production container
docker run -d -p 80:80 devstudio-frontend:latest

# Run with custom environment
docker run -d -p 80:80 -e NODE_ENV=production devstudio-frontend:latest
```

### Docker Compose

```bash
# Start production services
docker-compose up -d

# Start development services
docker-compose --profile dev up -d

# View logs
docker-compose logs -f frontend
```

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Testing Phase**
   - Unit tests with Vitest
   - Integration tests
   - E2E tests with Playwright
   - Type checking with TypeScript
   - Code linting with ESLint

2. **Build Phase**
   - Multi-environment builds
   - Docker image creation
   - Security scanning with Trivy

3. **Deployment Phase**
   - Staging deployment (develop branch)
   - Production deployment (main branch)
   - Performance auditing with Lighthouse

### Manual Deployment

Use the deployment script for manual deployments:

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

## Monitoring and Health Checks

### Health Check Endpoint

The application provides a health check endpoint at `/health` that monitors:

- API connectivity
- Socket.IO connection
- Browser capabilities
- Local storage functionality
- Performance metrics

### Performance Monitoring

The application tracks:

- **Core Web Vitals**: FCP, LCP, FID, CLS, TTFB
- **Bundle Performance**: Load times, chunk sizes
- **User Interactions**: Page views, user actions
- **Error Tracking**: JavaScript errors, unhandled promises

### Error Tracking

Integrated error tracking includes:

- Global error handlers
- Unhandled promise rejection tracking
- User context and breadcrumbs
- Performance impact monitoring

## Production Checklist

Before deploying to production, ensure:

- [ ] All environment variables are configured
- [ ] SSL certificates are valid
- [ ] CDN is configured for static assets
- [ ] Database connections are tested
- [ ] Monitoring and alerting are set up
- [ ] Backup and recovery procedures are in place
- [ ] Security headers are configured
- [ ] Performance benchmarks are met

## Security Considerations

### Content Security Policy

The application implements a strict CSP:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' ws: wss:;
frame-ancestors 'self';
```

### HTTP Security Headers

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Performance Optimization

### Bundle Optimization

- Vendor chunks separated by functionality
- Dynamic imports for route-based code splitting
- Asset compression and caching
- Service worker for offline capabilities

### Caching Strategy

- Static assets: 1 year cache with immutable flag
- HTML files: 5 minutes with must-revalidate
- API responses: No caching

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Clear node_modules and reinstall dependencies
   - Verify environment variables

2. **Docker Issues**
   - Ensure Docker daemon is running
   - Check available disk space
   - Verify Dockerfile syntax

3. **Performance Issues**
   - Run bundle analyzer to identify large chunks
   - Check network requests in browser dev tools
   - Monitor Core Web Vitals

4. **Deployment Failures**
   - Check CI/CD pipeline logs
   - Verify deployment credentials
   - Test health check endpoints

### Debugging

```bash
# View application logs
docker logs devstudio-frontend

# Check container health
docker inspect devstudio-frontend

# Run performance audit
npm run build:analyze
lighthouse http://localhost:3000 --view
```

### Support

For deployment issues:

1. Check the application logs
2. Verify environment configuration
3. Test health check endpoints
4. Review monitoring dashboards
5. Contact the development team

## Rollback Procedures

### Quick Rollback

```bash
# Rollback to previous Docker image
docker tag devstudio-frontend:previous devstudio-frontend:latest
docker-compose up -d

# Rollback using deployment script
./scripts/deploy.sh production --rollback
```

### Database Rollback

If database migrations are involved:

1. Stop the application
2. Restore database from backup
3. Deploy previous application version
4. Verify functionality

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review and rotate secrets quarterly
- Monitor performance metrics weekly
- Update security patches immediately
- Backup configuration files regularly

### Monitoring Alerts

Set up alerts for:

- Application errors (>1% error rate)
- Performance degradation (>20% slower)
- High memory usage (>80%)
- Failed health checks
- Security vulnerabilities