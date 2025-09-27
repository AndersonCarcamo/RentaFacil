/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // Configuración para SEO y performance
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimizaciones de imágenes
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rentafacil.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.rentafacil.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Configuración de headers para SEO y seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
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
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? '*' : 'https://rentafacil.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },

  // Rewrites para mejorar SEO de URLs
  async rewrites() {
    return [
      {
        source: '/propiedades/:type/:location/:id',
        destination: '/property/:id',
      },
      {
        source: '/buscar/:location',
        destination: '/search?location=:location',
      },
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap',
      },
      {
        source: '/robots.txt',
        destination: '/api/robots',
      },
    ]
  },

  // Redirects para URLs legacy
  async redirects() {
    return [
      {
        source: '/old-search',
        destination: '/search',
        permanent: true,
      },
      {
        source: '/properties/:slug*',
        destination: '/propiedades/:slug*',
        permanent: true,
      },
    ]
  },

  // Variables de entorno públicas
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },

  // Configuración experimental para mejor performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Configuración de Webpack para optimizaciones
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimizaciones para producción
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname),
      }
    }

    // Configuración para archivos SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    return config
  },

  // Configuración de salida estática para mejor SEO
  trailingSlash: false,
  
  // Configuración para PWA (si se implementa)
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  //   runtimeCaching: [
  //     {
  //       urlPattern: /^https?.*/,
  //       handler: 'NetworkFirst',
  //       options: {
  //         cacheName: 'offlineCache',
  //         expiration: {
  //           maxEntries: 200,
  //         },
  //       },
  //     },
  //   ],
  // },

  // Configuración de compresión
  compress: true,

  // Configuración de PoweredBy header
  poweredByHeader: false,

  // Configuración para i18n (internacional)
  // i18n: {
  //   locales: ['es', 'en'],
  //   defaultLocale: 'es',
  //   domains: [
  //     {
  //       domain: 'easyrent.com',
  //       defaultLocale: 'es',
  //     },
  //     {
  //       domain: 'easyrent.com/en',
  //       defaultLocale: 'en',
  //     },
  //   ],
  // },
}

module.exports = withBundleAnalyzer(nextConfig)