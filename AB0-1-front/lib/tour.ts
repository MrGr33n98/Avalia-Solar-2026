import { driver, DriveStep, Config } from 'driver.js';
import 'driver.js/dist/driver.css';

export interface TourStep extends DriveStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: 'left' | 'right' | 'top' | 'bottom';
    align?: 'start' | 'center' | 'end';
  };
}

const TOUR_STORAGE_KEY = 'ab01-dashboard-tour-completed';
const TOUR_VERSION = '1.0';

export const dashboardTourSteps: TourStep[] = [
  {
    element: '[data-tour="overview"]',
    popover: {
      title: 'Visão Geral do Dashboard',
      description: 'Aqui você acompanha as métricas principais da sua empresa: visualizações, leads e conversões.',
      side: 'bottom',
      align: 'start'
    }
  },
  {
    element: '[data-tour="metrics"]',
    popover: {
      title: 'Métricas de Performance',
      description: 'Monitore o desempenho da sua empresa em tempo real. Visualizações, cliques e taxas de conversão.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="reviews"]',
    popover: {
      title: 'Gestão de Avaliações',
      description: 'Acompanhe todas as avaliações recebidas, responda clientes e monitore sua reputação.',
      side: 'left'
    }
  },
  {
    element: '[data-tour="leads"]',
    popover: {
      title: 'Oportunidades de Negócio',
      description: 'Visualize e gerencie todas as oportunidades captadas através da plataforma.',
      side: 'left'
    }
  },
  {
    element: '[data-tour="analytics"]',
    popover: {
      title: 'Análise Detalhada',
      description: 'Acesse relatórios completos sobre tráfego, origem de visitantes e comportamento.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="ranking"]',
    popover: {
      title: 'Posicionamento no Mercado',
      description: 'Veja sua posição no ranking geral e por categoria. Compare-se com concorrentes.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="reputation"]',
    popover: {
      title: 'Score de Reputação',
      description: 'Acompanhe seu trust score e os componentes que influenciam sua reputação.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="settings"]',
    popover: {
      title: 'Configurações',
      description: 'Configure seu perfil, notificações e preferências. Você pode reiniciar este tour aqui a qualquer momento.',
      side: 'left'
    }
  }
];

export const tourConfig: Config = {
  showProgress: true,
  showButtons: ['next', 'previous', 'close'],
  nextBtnText: 'Próximo',
  prevBtnText: 'Anterior',
  doneBtnText: 'Concluir',
  progressText: '{{current}} de {{total}}',
  allowClose: true,
  overlayClickNext: false,
  smoothScroll: true,
  animate: true,
  onDestroyed: () => {
    markTourAsCompleted();
  }
};

export function isTourCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  const completed = localStorage.getItem(TOUR_STORAGE_KEY);
  return completed === TOUR_VERSION;
}

export function markTourAsCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOUR_STORAGE_KEY, TOUR_VERSION);
}

export function resetTour(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOUR_STORAGE_KEY);
}

export function startDashboardTour(onComplete?: () => void): void {
  const driverObj = driver({
    ...tourConfig,
    steps: dashboardTourSteps,
    onDestroyed: () => {
      markTourAsCompleted();
      onComplete?.();
    }
  });

  driverObj.drive();
}
