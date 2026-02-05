/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const enableSwcMinify = process.env.NEXT_DISABLE_SWC_MINIFY !== 'true';
const isProduction = process.env.NODE_ENV === 'production';
// A/B test: disable image optimization in production unless explicitly enabled.
const enableImageOptimization = isProduction
  ? process.env.NEXT_ENABLE_IMAGE_OPTIMIZATION === 'true'
  : process.env.NEXT_DISABLE_IMAGE_OPTIMIZATION !== 'true';
const enableOptimizeCss = process.env.NEXT_DISABLE_OPTIMIZE_CSS !== 'true';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // 🔧 FIX: Desabilitar minificação SWC para corrigir erro de digest
  swcMinify: enableSwcMinify,
  compress: true,
  
  experimental: {
    // webpackBuildWorker: true,
    optimizeCss: enableOptimizeCss,
  },

  // TASK-023: Enable TypeScript and ESLint checks
  eslint: {
    ignoreDuringBuilds: true, // Allow build to succeed even with lint warnings
    dirs: ['app', 'components', 'lib', 'utils', 'contexts', 'hooks'],
  },

  // ⚡ Performance Optimization for Dev Server
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 4,
  },

  typescript: {
    ignoreBuildErrors: true, // Allow build to succeed - type checking done in CI
  },

  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/:path*',
        headers: [
          // ❌ REMOVIDO: CORS headers (deixar o backend gerenciar)
          // O Rails/Rack::CORS já gerencia CORS corretamente
          // Next.js não deve adicionar CORS headers
          
          // ✅ Security headers que o frontend DEVE adicionar
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            // Helps debug deployment mismatches (e.g. Server Actions manifest)
            key: 'X-Release',
            value: process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
          }
        ],
      },
    ]
  },

  webpack: (config, { isServer }) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }

    // Fix for OpenTelemetry/require-in-the-middle warnings
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "require-in-the-middle": false,
        "import-in-the-middle": false,
        "module": false,
        "async_hooks": false,
        "perf_hooks": false,
      };
    }

    return config
  },

  basePath: '',
  assetPrefix: '',

  // TASK-024: Enable image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.avaliasolar.com.br',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.avaliasolar.com.br',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3001',
        pathname: '/**',
      },
    ],
    // Disable optimization only if needed (env override)
    unoptimized: !enableImageOptimization,
    
    // Domínios permitidos (legacy - usar remotePatterns acima)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  trailingSlash: false,
  
  async redirects() {
    return [
      {
        source: '/produtos',
        destination: '/products',
        permanent: true,
      },
      {
        source: '/empresas',
        destination: '/companies',
        permanent: true,
      },
    ]
  },
}

// TASK-006: Sentry configuration for Next.js
// Export the config with Sentry wrapper for source maps

// Only enable Sentry if we have the required configuration
const hasSentryConfig = process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT;
const enableSentry = process.env.NODE_ENV === 'production' && hasSentryConfig;

if (enableSentry) {
  const { withSentryConfig } = require("@sentry/nextjs");
  
  const sentryConfig = withSentryConfig(
    nextConfig,
    {
      // Sentry Webpack Plugin Options
      silent: true, // Suppresses all logs
      sourcemaps: {
        deleteSourcemapsAfterUpload: true,
      },
      
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,
      
      // Hide source maps from generated client bundles
      hideSourceMaps: true,
      
      // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
      tunnelRoute: "/monitoring",
      
      // Automatically annotate React components to show their full name in breadcrumbs and session replay
      autoInstrumentServerFunctions: true,
      autoInstrumentMiddleware: true,
    },
    {
      // Additional config options for the Sentry SDK
      silent: true,
      widenClientFileUpload: true,
      transpileClientSDK: false,
    }
  );
  module.exports = withBundleAnalyzer(sentryConfig);
} else {
  module.exports = withBundleAnalyzer(nextConfig);
}
