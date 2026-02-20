/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://rentafacil.com',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  
  // Rutas adicionales que no se generan automáticamente
  additionalPaths: async (config) => [
    await config.transform(config, '/propiedades'),
    await config.transform(config, '/buscar'),
    await config.transform(config, '/nosotros'),
    await config.transform(config, '/contacto'),
    await config.transform(config, '/ayuda'),
    await config.transform(config, '/terminos'),
    await config.transform(config, '/privacidad'),
  ],

  // URLs a excluir del sitemap
  exclude: [
    '/admin/*',
    '/api/*',
    '/404',
    '/500',
    '/_*',
    '/dashboard/*',
    '/perfil/*',
    '/auth/*'
  ],

  // Configuración del robots.txt
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/perfil/',
          '/auth/',
          '/_next/',
          '/static/'
        ]
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1
      }
    ],
    additionalSitemaps: [
      'https://rentafacil.com/sitemap-properties.xml',
      'https://rentafacil.com/sitemap-cities.xml'
    ]
  },

  // Configuración para diferentes idiomas (futuro)
  // i18n: {
  //   defaultLocale: 'es',
  //   locales: ['es', 'en'],
  // },

  // Transformar URLs para SEO mejorado
  transform: async (config, path) => {
    // Personalizar prioridad y frecuencia según el tipo de página
    let priority = config.priority
    let changefreq = config.changefreq

    if (path === '/') {
      priority = 1.0
      changefreq = 'daily'
    } else if (path.includes('/propiedades')) {
      priority = 0.9
      changefreq = 'weekly'
    } else if (path.includes('/buscar')) {
      priority = 0.8
      changefreq = 'weekly'
    } else if (path.includes('/ciudad')) {
      priority = 0.7
      changefreq = 'monthly'
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    }
  }
}