import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Clamp any untrusted value into an integer 0-100. */
export function clampScore(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function formatUsd(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '$0.0000';
  return `$${n.toFixed(4)}`;
}

export function formatRelativeTime(input) {
  if (!input) return 'never';
  const then = new Date(input).getTime();
  if (!Number.isFinite(then)) return 'unknown';
  const diff = Date.now() - then;
  if (diff < 0) return 'just now';
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(input).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDate(input) {
  if (!input) return '--';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Score band shared by cards, gauges and detail pages so a given number always
 * reads the same colour everywhere in the product.
 */
export function scoreBand(score) {
  const s = clampScore(score);
  if (s >= 90) return { key: 'critical', label: 'Critical signal', text: 'text-emerald-signal', bg: 'bg-emerald-signal/12', border: 'border-emerald-signal/30', hex: '#10b981' };
  if (s >= 80) return { key: 'high', label: 'High confidence', text: 'text-violet-signal', bg: 'bg-violet-signal/12', border: 'border-violet-signal/30', hex: '#8b5cf6' };
  if (s >= 70) return { key: 'emerging', label: 'Emerging driver', text: 'text-indigo-signal', bg: 'bg-indigo-signal/12', border: 'border-indigo-signal/30', hex: '#6366f1' };
  return { key: 'exploratory', label: 'Exploratory', text: 'text-amber-signal', bg: 'bg-amber-signal/12', border: 'border-amber-signal/30', hex: '#f59e0b' };
}

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
}

export function truncate(text, max = 160) {
  const s = String(text || '');
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

/** Always returns an array, whatever shape the model or DB handed us. */
export function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === '') return [];
  return [value];
}

/** UTC day key used for all quota accounting. */
export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
