import { NAME_COLORS } from './constants';

const nameColorCache: Record<string, string> = {};

export function getNameColor(name: string, fallback: string): string {
  if (!name) return fallback;
  if (nameColorCache[name]) return nameColorCache[name];
  const idx = Object.keys(nameColorCache).length % NAME_COLORS.length;
  nameColorCache[name] = NAME_COLORS[idx];
  return nameColorCache[name];
}

export function formatAUM(n: number | null | undefined): string {
  if (!n || isNaN(n)) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export function formatDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function daysUntil(d: string): number {
  const target = new Date(d);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export const fetcher = (url: string) => fetch(url).then(r => r.json());
