#!/bin/bash

# DevStudio Frontend Deployment Script
set -e

# Configuration
ENVIRONMENT=${1:-production}
BUILD_DIR="dist"
DOCKER_IMAGE="devstudio-frontend"
DOCKER_TAG="${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    echo "❌ Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    echo "📋 Loading environment variables from .env.${ENVIRONMENT}"
    export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
else
    echo "⚠️  No .env.${ENVIRONMENT} file found, using defaults"
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf $BUILD_DIR
npm run clean

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Run tests
echo "🧪 Running tests..."
npm run test:run

# Type checking
echo "🔍 Type checking..."
npm run type-check

# Linting
echo "🔧 Linting code..."
npm run lint

# Build application
echo "🏗️  Building application for $ENVIRONMENT..."
npm run build:${ENVIRONMENT}

# Verify build
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build failed - $BUILD_DIR directory not found"
    exit 1
fi

echo "✅ Build completed successfully"

# Build Docker image
echo "🐳 Building Docker image..."
docker build \
    --build-arg BUILD_ENV=$ENVIRONMENT \
    --tag $DOCKER_IMAGE:$DOCKER_TAG \
    --tag $DOCKER_IMAGE:$ENVIRONMENT-latest \
    .

echo "✅ Docker image built: $DOCKER_IMAGE:$DOCKER_TAG"

# Run security scan (if trivy is available)
if command -v trivy >/dev/null 2>&1; then
    echo "🔒 Running security scan..."
    trivy image --exit-code 1 --severity HIGH,CRITICAL $DOCKER_IMAGE:$DOCKER_TAG
    echo "✅ Security scan passed"
else
    echo "⚠️  Trivy not found, skipping security scan"
fi

# Performance audit (if lighthouse is available)
if command -v lighthouse >/dev/null 2>&1; then
    echo "⚡ Running performance audit..."
    # Start a temporary container for testing
    CONTAINER_ID=$(docker run -d -p 8080:80 $DOCKER_IMAGE:$DOCKER_TAG)
    sleep 5
    
    # Run lighthouse audit
    lighthouse http://localhost:8080 \
        --output json \
        --output-path lighthouse-report.json \
        --chrome-flags="--headless --no-sandbox" \
        --quiet
    
    # Stop the container
    docker stop $CONTAINER_ID
    docker rm $CONTAINER_ID
    
    echo "✅ Performance audit completed"
else
    echo "⚠️  Lighthouse not found, skipping performance audit"
fi

# Deploy based on environment
case $ENVIRONMENT in
    "development")
        echo "🚀 Starting development server..."
        docker run -d \
            --name devstudio-frontend-dev \
            -p 3000:80 \
            $DOCKER_IMAGE:$DOCKER_TAG
        echo "✅ Development server started at http://localhost:3000"
        ;;
    
    "staging")
        echo "🚀 Deploying to staging..."
        # Add your staging deployment commands here
        # Example: kubectl apply -f k8s/staging/
        # Example: docker-compose -f docker-compose.staging.yml up -d
        echo "✅ Deployed to staging environment"
        ;;
    
    "production")
        echo "🚀 Deploying to production..."
        # Add your production deployment commands here
        # Example: kubectl apply -f k8s/production/
        # Example: docker-compose -f docker-compose.production.yml up -d
        echo "✅ Deployed to production environment"
        ;;
esac

# Cleanup
echo "🧹 Cleaning up..."
# Keep the last 5 images
docker images $DOCKER_IMAGE --format "table {{.Tag}}\t{{.ID}}" | \
    grep -E "^${ENVIRONMENT}-[0-9]" | \
    tail -n +6 | \
    awk '{print $2}' | \
    xargs -r docker rmi

echo "🎉 Deployment completed successfully!"
echo "📊 Build info:"
echo "   Environment: $ENVIRONMENT"
echo "   Docker Image: $DOCKER_IMAGE:$DOCKER_TAG"
echo "   Build Time: $(date)"

# Send notification (if webhook URL is set)
if [ ! -z "$DEPLOYMENT_WEBHOOK_URL" ]; then
    curl -X POST "$DEPLOYMENT_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"✅ DevStudio Frontend deployed successfully\",
            \"environment\": \"$ENVIRONMENT\",
            \"image\": \"$DOCKER_IMAGE:$DOCKER_TAG\",
            \"timestamp\": \"$(date -Iseconds)\"
        }" || echo "⚠️  Failed to send notification"
fi