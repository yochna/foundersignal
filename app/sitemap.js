import { appUrl } from '@/lib/config';

const base = appUrl.replace(/\/+$/, '');

const ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/sample-report', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/login', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
];

export default function sitemap() {
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
