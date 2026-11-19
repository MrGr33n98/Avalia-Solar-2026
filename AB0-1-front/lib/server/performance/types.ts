import type { Company, Product, SearchAllResponse } from '@/lib/api';

export interface InitialCompaniesPayload {
  key: string;
  response: {
    data: Company[];
    meta?: { pagination?: { total?: number; total_pages?: number; page?: number } };
  };
}

export interface InitialProductsPayload {
  key: string;
  response: {
    data: Product[];
    meta: { total: number; total_pages: number; page: number; per_page: number };
  };
  filters: {
    filters?: unknown[];
    categories?: unknown[];
    companies?: unknown[];
    brands?: unknown[];
    price_range?: { min: number; max: number };
  };
}

export interface InitialSearchPayload {
  key: string;
  response: SearchAllResponse;
  pagination: { page: number; total_pages: number; total_count: number };
}
