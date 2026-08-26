// Design tokens para o Review Dashboard 2.0
// Baseado nas referências visuais aba-1 a aba-10

export const colors = {
  // Background
  dashboardBg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F7FA',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  // Primary (Azul funcional)
  primary: '#2563EB',
  primaryHover: '#1D4ED8',
  primarySoft: '#EFF6FF',

  // Brand (Amarelo Avalia Solar)
  brandYellow: '#FBBF24',
  brandYellowHover: '#F59E0B',
  brandYellowSoft: '#FFFBEB',

  // Semantic states
  success: '#16A34A',
  successSoft: '#F0FDF4',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  purple: '#7C3AED',
  purpleSoft: '#F5F3FF',

  // Borders
  border: '#E2E8F0',
  borderHover: '#CBD5E1',

  // Sidebar
  sidebarBg: '#FFFFFF',
  sidebarActiveBg: '#EFF6FF',
  sidebarActiveText: '#2563EB',
  sidebarActiveBorder: '#2563EB',
  sidebarHoverBg: '#F8FAFC',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '40px',
  '4xl': '48px',
  '5xl': '64px',
} as const;

export const radius = {
  small: '6px',
  medium: '8px',
  card: '12px',
  large: '16px',
  pill: '9999px',
} as const;

export const shadows = {
  none: 'none',
  subtle: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
  card: '0 1px 3px 0 rgb(0 0 0 / 0.04)',
  hover: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
} as const;

export const typography = {
  pageTitle: { size: '22px', smSize: '24px', weight: '700', lineHeight: '30px' },
  sectionTitle: { size: '15px', smSize: '16px', weight: '600', lineHeight: '22px' },
  cardTitle: { size: '13px', smSize: '14px', weight: '600', lineHeight: '20px' },
  body: { size: '12px', smSize: '13px', weight: '400', lineHeight: '18px' },
  helper: { size: '11px', smSize: '12px', weight: '400', lineHeight: '16px' },
  kpiValueShort: { size: '22px', smSize: '24px', weight: '700', lineHeight: '30px' },
  kpiValueText: { size: '16px', smSize: '20px', weight: '600', lineHeight: '24px' },
  label: { size: '11px', smSize: '12px', weight: '500', lineHeight: '16px' },
} as const;

export const layout = {
  topbarHeight: 'var(--app-navbar-height)',
  sidebarExpanded: '232px',
  sidebarCollapsed: '72px',
  contentMaxWidth: '1280px',
  contentPadding: '32px',
  gridGap: '24px',
  mobileBottomNavHeight: 'var(--reviewer-mobile-nav-height)',
} as const;

export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px',
  desktopXl: '1440px',
} as const;
