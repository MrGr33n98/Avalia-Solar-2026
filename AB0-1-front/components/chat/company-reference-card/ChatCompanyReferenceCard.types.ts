export interface ChatCompanyReferenceCardCompany {
  id: string | number;
  name: string;
  slug: string;
  logoUrl?: string | null;
  city?: string | null;
  state?: string | null;
  rating?: number | null;
  ratingCount?: number;
  reviewsCount?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  isSponsored?: boolean;
  services?: string[];
  profileUrl?: string;
  reviewSnippet?: string;
  placement?: string;
}

export interface ChatCompanyReferenceCardProps {
  company: ChatCompanyReferenceCardCompany;
  isSelectedForComparison?: boolean;
  selectedPosition?: number | null;
  maxComparison?: number;
  onCompare?: () => void;
  onReviews?: () => void;
  onBudget?: () => void;
  isBudgetLoading?: boolean;
  /** Feature flags */
  compareEnabled?: boolean;
  showServices?: boolean;
}