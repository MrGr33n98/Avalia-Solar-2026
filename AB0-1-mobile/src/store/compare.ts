import { create } from 'zustand';

export interface CompareCompany {
  id: string;
  name: string;
  logoUrl?: string;
  ratingAvg?: number;
  reviewsCount?: number;
  isVerified?: boolean;
  priceEstimate?: string;
  warrantyYears?: number;
  installTimeDays?: number;
  powerKwp?: number;
}

interface CompareStore {
  selectedCompanies: CompareCompany[];
  addCompany: (company: CompareCompany) => void;
  removeCompany: (id: string) => void;
  clearCompare: () => void;
  isComparing: (id: string) => boolean;
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  selectedCompanies: [],
  
  addCompany: (company) => {
    const { selectedCompanies } = get();
    // Maximum 3 companies to compare on mobile
    if (selectedCompanies.length >= 3) {
      // You could also trigger a toast/alert here or let the UI handle it
      return;
    }
    // Prevent duplicates
    if (!selectedCompanies.find((c) => c.id === company.id)) {
      set({ selectedCompanies: [...selectedCompanies, company] });
    }
  },
  
  removeCompany: (id) => {
    set((state) => ({
      selectedCompanies: state.selectedCompanies.filter((c) => c.id !== id),
    }));
  },
  
  clearCompare: () => {
    set({ selectedCompanies: [] });
  },
  
  isComparing: (id) => {
    return get().selectedCompanies.some((c) => c.id === id);
  },
}));
