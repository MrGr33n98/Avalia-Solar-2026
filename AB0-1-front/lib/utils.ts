import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
}

export const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
  'uol.com.br',
  'terra.com.br',
  'bol.com.br',
  'ig.com.br',
  'globomail.com'
];

export function isCorporateEmail(email: string) {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return !!(domain && !PUBLIC_EMAIL_DOMAINS.includes(domain));
}
