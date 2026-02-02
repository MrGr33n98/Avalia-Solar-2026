import type { Company } from '@/lib/api';

export interface Category {
  id: number;
  name: string;
  description: string;
  short_description?: string;
  seo_title?: string;
  seo_url?: string;
  parent_id?: number;
  kind?: string;
  status?: string;
  featured?: boolean;
  subcategories?: Category[];
}

export interface Product {
  id: number;
  name: string;
  description: string;
  short_description?: string;
  price: number;
  status?: string;
  created_at: string;
  updated_at: string;
  category: Category;
  categories?: Category[];
  company: Company;
  image_url?: string;
  sku?: string;
  specs?: ProductSpec[];
}

export interface ProductSpec {
  key: string;
  label: string;
  type: string;
  unit?: string;
  filterable?: boolean;
  sortable?: boolean;
  comparable?: boolean;
  seo_weight?: number;
  value: any;
}
