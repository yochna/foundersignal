import {
  Radar,
  Sparkles,
  UserCheck,
  Briefcase,
  Bookmark,
  MessageSquare,
  Gauge,
  Route,
} from 'lucide-react';

/**
 * Single navigation registry. Drives the desktop rail, the mobile tab bar, the
 * command palette, and the login page feature list, so they can never drift.
 */
export const NAV_ITEMS = [
  {
    href: '/radar',
    label: 'Opportunity Radar',
    short: 'Radar',
    icon: Radar,
    description: 'Scored startup opportunities from live market signals',
    keywords: ['dashboard', 'feed', 'opportunities', 'home', 'sectors'],
    group: 'Discover',
  },
  {
    href: '/idea-validator',
    label: 'Idea Validator',
    short: 'Validate',
    icon: Sparkles,
    description: 'Score your own idea across six dimensions',
    keywords: ['validate', 'my idea', 'viability', 'scorecard'],
    group: 'Evaluate',
    requiresAi: true,
  },
  {
    href: '/builder-match',
    label: 'Builder Match',
    short: 'Match',
    icon: UserCheck,
    description: 'Rank opportunities against your skills and constraints',
    keywords: ['quiz', 'fit', 'profile', 'diagnostic'],
    group: 'Evaluate',
    requiresAi: true,
  },
  {
    href: '/career-signal',
    label: 'Career Signal',
    short: 'Career',
    icon: Briefcase,
    description: 'Market demand score and skill gaps from your resume',
    keywords: ['resume', 'cv', 'skills', 'salary', 'hiring'],
    group: 'Evaluate',
    requiresAi: true,
  },
  {
    href: '/roadmap',
    label: 'Suggested Roadmap',
    short: 'Roadmap',
    icon: Route,
    description: 'A phased plan for your role, idea or startup',
    keywords: ['plan', 'roadmap', 'steps', 'milestones', 'timeline', 'phases', 'launch plan'],
    group: 'Evaluate',
    requiresAi: true,
  },
  {
    href: '/chat',
    label: 'AI Copilot',
    short: 'Copilot',
    icon: MessageSquare,
    description: 'Ask questions grounded in the opportunity database',
    keywords: ['chat', 'ask', 'copilot', 'assistant', 'rag'],
    group: 'Evaluate',
    requiresAuth: true,
    requiresAi: true,
  },
  {
    href: '/saved',
    label: 'Saved Watchlist',
    short: 'Saved',
    icon: Bookmark,
    description: 'Opportunities you shortlisted to track',
    keywords: ['bookmarks', 'watchlist', 'shortlist', 'starred'],
    group: 'Track',
    requiresAuth: true,
  },
  {
    href: '/admin',
    label: 'Admin Control',
    short: 'Admin',
    icon: Gauge,
    description: 'Ingestion runs, source health, AI usage and cost',
    keywords: ['pipeline', 'ingest', 'metrics', 'health', 'cost', 'usage'],
    group: 'Operate',
    requiresAuth: true,
    requiresAdmin: true,
  },
];

/** Items shown in the mobile bottom bar; admin lives in the overflow menu. */
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) => !item.requiresAdmin);

export const NAV_GROUPS = ['Discover', 'Evaluate', 'Track', 'Operate'];

export function isActivePath(pathname, href) {
  if (!pathname) return false;
  if (href === '/radar') {
    return pathname === '/radar' || pathname.startsWith('/opportunities');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
