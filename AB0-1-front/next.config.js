/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const enableSwcMinify = process.env.NEXT_DISABLE_SWC_MINIFY !== 'true';
const isProduction = process.env.NODE_ENV === 'production';
const normalizeApiTarget = (value = '') => value.replace(/\/+$/, '').replace(/\/api\/v1$/i, '');
const apiProxyTarget = normalizeApiTarget(
  process.env.API_PROXY_TARGET ||
  process.env.API_URL_INTERNAL ||
  (
    isProduction
      ? (process.env.NEXT_PUBLIC_API_URL?.startsWith('http') 
          ? process.env.NEXT_PUBLIC_API_URL 
          : 'http://ab0-backend:3001')
      : (
          process.env.NEXT_PUBLIC_API_BASE_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          'http://localhost:3001'
        )
  )
);
const stableBuildId = process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.SOURCE_VERSION;
// Keep image optimization on by default. Only disable with explicit opt-out.
const enableImageOptimization = process.env.NEXT_DISABLE_IMAGE_OPTIMIZATION !== 'true';
const enableOptimizeCss = process.env.NEXT_DISABLE_OPTIMIZE_CSS !== 'true';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  ...(stableBuildId ? { generateBuildId: async () => stableBuildId } : {}),

  swcMinify: enableSwcMinify,
  compress: true,
  compiler: {
    ...(isProduction ? { removeConsole: { exclude: ['error', 'warn'] } } : {}),
  },

  experimental: {
    // webpackBuildWorker: true,
    optimizeCss: enableOptimizeCss,
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-tabs',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-accordion',
      'cmdk',
    ],
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
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=86400'
          }
        ],
      },
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
        protocol: 'https',
        hostname: 'nyc3.digitaloceanspaces.com',
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

  async rewrites() {
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
    return {
      beforeFiles: [
        // Proxy reverso para PostHog — evita bloqueio por ad-blockers (Brave, uBlock, etc.)
        {
          source: '/ingest/static/:path*',
          destination: `${posthogHost}/static/:path*`,
        },
        {
          source: '/ingest/:path*',
          destination: `${posthogHost}/:path*`,
        },
      ],
      fallback: [
        {
          source: '/api/v1/:path*',
          destination: `${apiProxyTarget}/api/v1/:path*`,
        },
      ],
    };
  },
  
  async redirects() {
    return [
      {
        source: '/dashboard/overview',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/dashboard/company',
        destination: '/dashboard',
        permanent: true,
      },
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
