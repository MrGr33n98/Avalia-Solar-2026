import { ApiError, isApiError } from '@/lib/api-error';

export type ProposalScreenState =
  | 'loading'
  | 'empty'
  | 'error'
  | 'unauthorized'
  | 'permission_denied'
  | 'not_found'
  | 'rate_limited'
  | 'offline'
  | 'draft_pending'
  | 'ready';

export interface ProposalActionConfig {
  label: string;
  href?: string;
  action?: 'retry' | 'navigate_list' | 'login' | 'help' | 'back';
}

export interface ProposalStateConfig {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  primaryAction?: ProposalActionConfig;
  secondaryAction?: ProposalActionConfig;
  canRetry?: boolean;
}

export const proposalStateMessages: Record<
  Exclude<ProposalScreenState, 'ready'>,
  ProposalStateConfig
> = {
  loading: {
    title: 'Carregando propostas...',
    description: 'Buscando as propostas atualizadas recebidas das empresas instaladoras.',
  },
  empty: {
    title: 'Ainda não existem propostas',
    description:
      'Assim que as empresas parceiras analisarem sua solicitação e enviarem orçamentos, elas aparecerão aqui.',
    actionLabel: 'Ver minhas solicitações',
    actionHref: '/dashboard/leads',
    primaryAction: {
      label: 'Explorar empresas',
      href: '/companies',
      action: 'help',
    },
    secondaryAction: {
      label: 'Ajuda',
      href: '/contato',
      action: 'help',
    },
    canRetry: false,
  },
  unauthorized: {
    title: 'Sessão expirada',
    description: 'Sua sessão expirou ou requer nova autenticação para continuar.',
    actionLabel: 'Entrar novamente',
    actionHref: '/login',
    primaryAction: {
      label: 'Entrar novamente',
      action: 'login',
    },
    secondaryAction: {
      label: 'Voltar',
      action: 'navigate_list',
    },
    canRetry: false,
  },
  permission_denied: {
    title: 'Acesso a esta proposta não autorizado',
    description:
      'Esta proposta está vinculada a outro usuário ou solicitação. Verifique se está conectado na conta correta.',
    actionLabel: 'Minhas propostas',
    primaryAction: {
      label: 'Minhas propostas',
      action: 'navigate_list',
    },
    secondaryAction: {
      label: 'Ajuda',
      href: '/contato',
      action: 'help',
    },
    canRetry: false,
  },
  not_found: {
    title: 'Proposta indisponível',
    description:
      'Esta proposta não foi encontrada, foi removida ou o link informado está incorreto.',
    actionLabel: 'Minhas propostas',
    primaryAction: {
      label: 'Minhas propostas',
      action: 'navigate_list',
    },
    secondaryAction: {
      label: 'Atualizar lista',
      action: 'retry',
    },
    canRetry: false,
  },
  rate_limited: {
    title: 'Muitas solicitações',
    description:
      'Recebemos muitas requisições em curto intervalo. Aguarde alguns instantes antes de tentar novamente.',
    actionLabel: 'Aguardar e tentar novamente',
    primaryAction: {
      label: 'Aguardar e tentar novamente',
      action: 'retry',
    },
    secondaryAction: {
      label: 'Voltar',
      action: 'navigate_list',
    },
    canRetry: false,
  },
  error: {
    title: 'Falha temporária de comunicação',
    description:
      'Não foi possível carregar os detalhes da proposta no momento. Verifique sua conexão e tente novamente.',
    actionLabel: 'Tentar novamente',
    primaryAction: {
      label: 'Tentar novamente',
      action: 'retry',
    },
    secondaryAction: {
      label: 'Minhas propostas',
      action: 'navigate_list',
    },
    canRetry: true,
  },
  offline: {
    title: 'Você está offline',
    description: 'Conecte-se à internet para carregar e interagir com as propostas.',
    actionLabel: 'Tentar novamente',
    primaryAction: {
      label: 'Tentar novamente',
      action: 'retry',
    },
    secondaryAction: {
      label: 'Minhas propostas',
      action: 'navigate_list',
    },
    canRetry: true,
  },
  draft_pending: {
    title: 'Aguardando proposta da empresa',
    description:
      'A empresa recebeu sua solicitação e está preparando a proposta técnica personalizada.',
    actionLabel: 'Ver solicitação',
    actionHref: '/dashboard/leads',
    primaryAction: {
      label: 'Ver solicitação',
      action: 'navigate_list',
    },
    secondaryAction: {
      label: 'Conversar',
      action: 'help',
    },
    canRetry: false,
  },
};

export interface ClassifiedProposalError {
  state: ProposalScreenState;
  status?: number;
  message: string;
  config: ProposalStateConfig;
  canRetry: boolean;
}

/**
 * Classifica qualquer erro ocorrido ao consultar propostas,
 * respeitando estritamente o ApiError.status e evitando heurísticas por substring quando possível.
 */
export function classifyProposalError(error: unknown): ClassifiedProposalError {
  if (isApiError(error)) {
    const status = error.status;
    if (status === 401) {
      return {
        state: 'unauthorized',
        status: 401,
        message: error.message || proposalStateMessages.unauthorized.description,
        config: proposalStateMessages.unauthorized,
        canRetry: false,
      };
    }
    if (status === 403) {
      return {
        state: 'permission_denied',
        status: 403,
        message: error.message || proposalStateMessages.permission_denied.description,
        config: proposalStateMessages.permission_denied,
        canRetry: false,
      };
    }
    if (status === 404) {
      return {
        state: 'not_found',
        status: 404,
        message: error.message || proposalStateMessages.not_found.description,
        config: proposalStateMessages.not_found,
        canRetry: false,
      };
    }
    if (status === 429) {
      return {
        state: 'rate_limited',
        status: 429,
        message: error.message || proposalStateMessages.rate_limited.description,
        config: proposalStateMessages.rate_limited,
        canRetry: false,
      };
    }
    if (error.isNetworkError || error.isTimeout) {
      return {
        state: 'offline',
        status,
        message: error.message || proposalStateMessages.offline.description,
        config: proposalStateMessages.offline,
        canRetry: true,
      };
    }
    if (status && status >= 500) {
      return {
        state: 'error',
        status,
        message: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
        config: proposalStateMessages.error,
        canRetry: true,
      };
    }
  }

  // Fallback para objetos de erro genéricos com status
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = Number((error as { status?: unknown }).status);
    if (status === 401) {
      return {
        state: 'unauthorized',
        status: 401,
        message: proposalStateMessages.unauthorized.description,
        config: proposalStateMessages.unauthorized,
        canRetry: false,
      };
    }
    if (status === 403) {
      return {
        state: 'permission_denied',
        status: 403,
        message: proposalStateMessages.permission_denied.description,
        config: proposalStateMessages.permission_denied,
        canRetry: false,
      };
    }
    if (status === 404) {
      return {
        state: 'not_found',
        status: 404,
        message: proposalStateMessages.not_found.description,
        config: proposalStateMessages.not_found,
        canRetry: false,
      };
    }
    if (status === 429) {
      return {
        state: 'rate_limited',
        status: 429,
        message: proposalStateMessages.rate_limited.description,
        config: proposalStateMessages.rate_limited,
        canRetry: false,
      };
    }
  }

  // Fallback padrão de erro genérico
  return {
    state: 'error',
    message: proposalStateMessages.error.description,
    config: proposalStateMessages.error,
    canRetry: true,
  };
}
