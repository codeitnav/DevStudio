// Production configuration for DevStudio Frontend
module.exports = {
  // Build optimization settings
  build: {
    // Enable source maps for debugging (hidden in production)
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
    
    // Minification settings
    minify: {
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      collapseWhitespace: true,
      conservativeCollapse: true,
      minifyCSS: true,
      minifyJS: true,
    },
    
    // Bundle splitting strategy
    chunkSizeWarningLimit: 1000,
    
    // Asset optimization
    assetsInlineLimit: 4096,
  },
  
  // Performance monitoring
  monitoring: {
    // Core Web Vitals thresholds
    performance: {
      fcp: 1800, // First Contentful Paint (ms)
      lcp: 2500, // Largest Contentful Paint (ms)
      fid: 100,  // First Input Delay (ms)
      cls: 0.1,  // Cumulative Layout Shift
      ttfb: 800, // Time to First Byte (ms)
    },
    
    // Bundle size limits
    bundleSize: {
      maxSize: 500 * 1024, // 500KB
      maxChunkSize: 200 * 1024, // 200KB per chunk
    },
    
    // Error tracking
    errorTracking: {
      sampleRate: 1.0, // Track 100% of errors in production
      enableBreadcrumbs: true,
      maxBreadcrumbs: 50,
    },
  },
  
  // Security settings
  security: {
    // Content Security Policy
    csp: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "https:"],
      'font-src': ["'self'", "data:"],
      'connect-src': ["'self'", "ws:", "wss:"],
      'frame-ancestors': ["'self'"],
    },
    
    // HTTP headers
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  },
  
  // Caching strategy
  caching: {
    // Static assets (JS, CSS, images)
    staticAssets: {
      maxAge: 31536000, // 1 year
      immutable: true,
    },
    
    // HTML files
    html: {
      maxAge: 300, // 5 minutes
      mustRevalidate: true,
    },
    
    // API responses
    api: {
      maxAge: 0, // No caching for API responses
      noCache: true,
    },
  },
  
  // Deployment settings
  deployment: {
    // Health check configuration
    healthCheck: {
      path: '/health',
      interval: 30000, // 30 seconds
      timeout: 5000,   // 5 seconds
      retries: 3,
    },
    
    // Rolling deployment
    rolling: {
      maxUnavailable: 1,
      maxSurge: 1,
    },
    
    // Resource limits
    resources: {
      requests: {
        cpu: '100m',
        memory: '128Mi',
      },
      limits: {
        cpu: '500m',
        memory: '512Mi',
      },
    },
  },
  
  // Environment-specific overrides
  environments: {
    staging: {
      monitoring: {
        errorTracking: {
          sampleRate: 0.5, // Sample 50% of errors in staging
        },
      },
    },
    
    development: {
      build: {
        sourcemap: true,
        minify: false,
      },
      monitoring: {
        errorTracking: {
          sampleRate: 0.1, // Sample 10% of errors in development
        },
      },
    },
  },
};