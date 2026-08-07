/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { BarChart3, Home, Menu, MessageCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onOpenNavigation: () => void;
  pendingReviewsCount?: number;
}

const items = [
  { id: 'overview', label: 'Início', icon: Home, tabs: ['overview'] },
  { id: 'reviews', label: 'Avaliações', icon: Star, tabs: ['reviews', 'review-forms'] },
  { id: 'live-inbox', label: 'Mensagens', icon: MessageCircle, tabs: ['live-inbox'] },
  {
    id: 'ranking-performance',
    label: 'Desempenho',
    icon: BarChart3,
    tabs: ['ranking-performance', 'analytics'],
  },
] as const;

export default function MobileBottomNavigation({
  activeTab,
  onTabChange,
  onOpenNavigation,
  pendingReviewsCount = 0,
}: MobileBottomNavigationProps) {
  return null;
}
