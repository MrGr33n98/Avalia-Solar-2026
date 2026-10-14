export type WizardCompany = {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
  rating_avg?: number | null;
  reviews_count?: number | null;
  verified?: boolean | null;
  featured?: boolean | null;
  logo_url?: string | null;
};

export type WizardFormState = {
  productVertical: string;
  projectProfile: string;
  quoteType: string;
  systemSizeChoice: string;
  billValue: string;
  monthlyKwh: string;
  installationType: string;
  decisionTimeline: string;
  zipcode: string;
  addressFull: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  city: string;
  state: string;
  fullName: string;
  email: string;
  phone: string;
  preferredChannel: string;
  notes: string;
  consent: boolean;
  nickname: string;
};

export const INITIAL_WIZARD_FORM: WizardFormState = {
  productVertical: 'Energia solar e baterias',
  projectProfile: 'Residencial',
  quoteType: 'Energia Solar',
  systemSizeChoice: '',
  billValue: '',
  monthlyKwh: '',
  installationType: 'Telhado Ceramico',
  decisionTimeline: 'Agora',
  zipcode: '',
  addressFull: '',
  addressStreet: '',
  addressNumber: '',
  addressComplement: '',
  city: '',
  state: '',
  fullName: '',
  email: '',
  phone: '',
  preferredChannel: 'WhatsApp',
  notes: '',
  consent: false,
  nickname: '',
};

export type SolutionOption = {
  label: string;
  quoteType: string;
  slug: string;
  iconAsset: string;
  alt: string;
  tagline: string;
};

export const SOLUTION_OPTIONS: SolutionOption[] = [
  {
    label: 'Energia solar e baterias',
    quoteType: 'Energia Solar',
    slug: 'solar-residencial',
    iconAsset: '/3d-refined/A04_energia-solar-residencial-256.webp',
    alt: 'Energia solar fotovoltaica residencial com baterias',
    tagline: 'Economize até 95% na conta de luz',
  },
  {
    label: 'Carregadores veiculares (EV)',
    quoteType: 'Carregador EV',
    slug: 'wallbox-residencial',
    iconAsset: '/3d-refined/D02_carregadores-residenciais-wallbox-256.webp',
    alt: 'Carregador veicular Wallbox para veículos elétricos',
    tagline: 'Wallbox inteligente residencial e empresarial',
  },
  {
    label: 'Baterias e armazenamento',
    quoteType: 'Baterias',
    slug: 'baterias',
    iconAsset: '/3d-refined/A01_baterias-e-armazenamento-de-energia-256.webp',
    alt: 'Baterias e sistemas de armazenamento de energia',
    tagline: 'Autonomia contínua e backup contra apagões',
  },
];

export type ProjectProfileOption = {
  label: string;
  value: string;
  canonical: string;
  iconName: 'Home' | 'Building' | 'Building2';
  description: string;
};

export const PROJECT_PROFILE_OPTIONS: ProjectProfileOption[] = [
  {
    label: 'Residencial',
    value: 'Residencial',
    canonical: 'residential',
    iconName: 'Home',
    description: 'Casas e sobrados',
  },
  {
    label: 'Condomínio',
    value: 'Condomínio',
    canonical: 'condominium',
    iconName: 'Building',
    description: 'Prédios e garagens coletivas',
  },
  {
    label: 'Comercial',
    value: 'Comercial',
    canonical: 'commercial',
    iconName: 'Building2',
    description: 'Comércios e indústrias',
  },
];
