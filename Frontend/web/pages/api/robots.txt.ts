import { NextApiRequest, NextApiResponse } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const robotsTxt = `# *
User-agent: *
Allow: /

# Disallow admin or private pages
Disallow: /api/
Disallow: /admin/
Disallow: /_next/

# Sitemap
Sitemap: ${SITE_URL}/api/sitemap.xml

# Crawl-delay (optional, para evitar sobrecarga)
Crawl-delay: 1
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.status(200).send(robotsTxt);
}
