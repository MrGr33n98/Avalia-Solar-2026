export interface CategoryTreeNode {
  id: number;
  name: string;
  slug: string;
  companies_count: number;
  children: CategoryTreeNode[];
}

export interface StateOption {
  state: string;
  count: number;
}

export interface CompanyFilters {
  category_ids: number[];
  states: string[];
  min_rating: number | null;
  verified: boolean;
}

export const DEFAULT_FILTERS: CompanyFilters = {
  category_ids: [],
  states: [],
  min_rating: null,
  verified: false,
};
