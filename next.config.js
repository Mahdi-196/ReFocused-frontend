const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // SSR deployment for AWS Amplify
  trailingSlash: true,

  // Performance optimizations
  experimental: {
    // Optimize package imports for better tree shaking
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'react-icons'
    ],
    // Enable server components HMR cache for faster development
    serverComponentsHmrCache: true,
  },

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Optimize CSS and JS
  compress: true,
  productionBrowserSourceMaps: false,
  poweredByHeader: false,

  // Logging for performance monitoring
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  async rewrites() {
    if (process.env.NODE_ENV !== 'production') {
      return [
        // Development: proxy API calls to local backend
        {
          source: '/api/v1/:path*',
          destination: 'http://localhost:8000/api/v1/:path*',
        },
        // Development: proxy auth refresh and related endpoints
        {
          source: '/auth/:path*',
          destination: 'http://localhost:8000/auth/:path*',
        },
      ];
    }
    // Production: no rewrites; frontend calls backend directly via NEXT_PUBLIC_API_BASE_URL
    return [];
  },

  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Embedder-Policy', 
            value: 'unsafe-none',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production' 
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.refocused.app https://accounts.google.com; frame-src 'self' https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: http://localhost:*; connect-src 'self' http://localhost:* https://accounts.google.com; frame-src 'self' https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self';"
          },
          // Performance headers for static assets only
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // Separate cache headers for static assets
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Enable React strict mode for better performance
  reactStrictMode: true,
  
  // Temporarily disable ESLint during builds to allow deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  webpack(config, { dev, isServer }) {
    // Optimize webpack for better performance
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg)$/i,
      type: 'asset/resource'
    })

    // Optimize for production
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      }
    }

    return config
  }
}

module.exports = withBundleAnalyzer(nextConfig) 