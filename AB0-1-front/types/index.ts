import type { Company } from '@/lib/api';

export interface Category {
  id: number;
  name: string;
  description: string;
  short_description?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_url?: string;
  parent_id?: number;
  kind?: string;
  status?: string;
  featured?: boolean;
  subcategories?: Category[];
  companies_count?: number;
  products_count?: number;
}

export interface CategoryTreeNode {
  id: number;
  name: string;
  slug: string;
  seo_url?: string;
  parent_id: number | null;
  companies_count: number;
  products_count: number;
  icon_url?: string;
  average_rating?: number;
  reviews_count?: number;
  children: CategoryTreeNode[];
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
