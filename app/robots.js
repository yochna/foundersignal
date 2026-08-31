import { appUrl } from '@/lib/config';

const base = appUrl.replace(/\/+$/, '');

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/(app)/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
