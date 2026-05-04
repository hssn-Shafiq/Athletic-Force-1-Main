import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://athleticforce1.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/account/',
        '/cart/',
        '/checkout/',
        '/api/',
        '/*?*', // Disallow search/filter query strings to prevent crawl bloat
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
