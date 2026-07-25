import {
  Banknote,
  Edit,
  HelpCircle,
  ImageIcon,
  LayoutDashboard,
  LucideIcon,
  MessageCircle,
  Package,
} from 'lucide-react';

export interface CompanyProfileTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface GetCompanyProfileTabsOptions {
  showFinancing: boolean;
  showGallery: boolean;
  showFaq: boolean;
  canEdit?: boolean;
}

export function getCompanyProfileTabs({
  showFinancing,
  showGallery,
  showFaq,
  canEdit = false,
}: GetCompanyProfileTabsOptions): CompanyProfileTabItem[] {
  const tabs: CompanyProfileTabItem[] = [
    { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'products', label: 'Produtos e Serviços', icon: Package },
    { id: 'reviews', label: 'Avaliações', icon: MessageCircle },
  ];

  if (showFinancing) {
    tabs.push({ id: 'financing', label: 'Financiamento', icon: Banknote });
  }

  if (showGallery) {
    tabs.push({ id: 'projects', label: 'Projetos', icon: ImageIcon });
  }

  tabs.push({ id: 'contact', label: 'Contato', icon: HelpCircle });

  if (showFaq) {
    tabs.push({ id: 'faq', label: 'Perguntas Frequentes (FAQ)', icon: HelpCircle });
  }

  if (canEdit) {
    tabs.push({ id: 'edit', label: 'Editar', icon: Edit });
  }

  return tabs;
}
