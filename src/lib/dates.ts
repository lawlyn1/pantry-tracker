import type { ExpirationStatus } from '@/types';

const MS_PER_DAY = 86_400_000;

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const daysUntil = (isoDate: string, now = Date.now()): number => {
  const d = new Date(isoDate).getTime();
  return Math.ceil((d - now) / MS_PER_DAY);
};

export interface ExpirationBadge {
  status: ExpirationStatus;
  className: string;
  label: string;
}

const BADGES: Record<ExpirationStatus, Omit<ExpirationBadge, 'status'>> = {
  expired:          { className: 'bg-red-100 text-red-800',       label: 'Expired' },
  'expiring-soon':  { className: 'bg-orange-100 text-orange-800', label: 'Expiring Soon' },
  'expiring-week':  { className: 'bg-yellow-100 text-yellow-800', label: 'Expiring This Week' },
  fresh:            { className: 'bg-green-100 text-green-800',   label: 'Fresh' },
};

export const expirationBadge = (isoDate: string, now = Date.now()): ExpirationBadge => {
  const days = daysUntil(isoDate, now);
  const status: ExpirationStatus =
    days < 0 ? 'expired' :
    days <= 3 ? 'expiring-soon' :
    days <= 7 ? 'expiring-week' : 'fresh';
  return { status, ...BADGES[status] };
};

export const formatDate = (iso: string): string => new Date(iso).toLocaleDateString();
