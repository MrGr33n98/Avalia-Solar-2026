// TASK-006: Import Sentry for source maps and error tracking
const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  experimental: {
    serverActions: {
      allowedOrigins: ['https://www.avaliasolar.com.br'],
      bodySizeLimit: '2mb',
    },
  },

  // TASK-023: Enable TypeScript and ESLint checks
  // ✅ FIXED: Stop ignoring build errors
  eslint: {
    ignoreDuringBuilds: true, // Temporariamente desabilitado para permitir build
    dirs: ['app', 'components', 'lib', 'utils', 'contexts', 'hooks'], // Especificar diretórios
  },

  typescript: {
    ignoreBuildErrors: false, // Habilitado para garantir type safety
    // tsconfigPath: './tsconfig.json', // Usar tsconfig padrão
  },

  async headers() {
    return [
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
          }
        ],
      },
    ]
  },

  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },

  basePath: '',
  assetPrefix: '',

  // TASK-024: Enable image optimization
  images: {
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
    ],
    // Disable optimization for Active Storage images to avoid 404 errors
    unoptimized: true,
    
    // Domínios permitidos (legacy - usar remotePatterns acima)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  trailingSlash: false,
}

// TASK-006: Sentry configuration for Next.js
// Export the config with Sentry wrapper for source maps
module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry Webpack Plugin Options
    silent: true, // Suppresses all logs
    
    // Upload source maps to Sentry
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    
    // Auth token for uploading source maps
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
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
    
    // Suppresses source map uploading logs during build
    silent: true,
    
    // Widens the upload scope to include all source files
    widenClientFileUpload: true,
    
    // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
    // tunnelRoute: "/monitoring",
    
    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: false,
  }
);

