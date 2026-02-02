import { CategoryTreeNode } from '@/types';

export interface StateOption {
  state: string;
  count: number;
}

export interface CityOption {
  city: string;
  state: string;
  count: number;
}

export interface CompanyFilters {
  search: string;
  state: string[];
  city: string[];
  category_ids: number[];
  min_rating: number | null; // 3|4|5
  verified: boolean;
  featured: boolean;
  financing_enabled: boolean;
  whatsapp_enabled: boolean;
  sort: string;
  page: number;
}

export const DEFAULT_FILTERS: CompanyFilters = {
  search: '',
  state: [],
  city: [],
  category_ids: [],
  min_rating: null,
  verified: false,
  featured: false,
  financing_enabled: false,
  whatsapp_enabled: false,
  sort: 'recommended',
  page: 1,
};
