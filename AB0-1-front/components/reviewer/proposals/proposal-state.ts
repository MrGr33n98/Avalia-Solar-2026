export type ProposalScreenState =
  | 'loading'
  | 'empty'
  | 'error'
  | 'permission_denied'
  | 'offline'
  | 'draft_pending'
  | 'ready';

export interface ProposalStateConfig {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
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
    title: 'Nenhuma proposta recebida ainda',
    description:
      'Assim que as empresas parceiras analisarem sua solicitação e enviarem orçamentos, elas aparecerão aqui.',
    actionLabel: 'Ver minhas solicitações',
    actionHref: '/dashboard/leads',
  },
  error: {
    title: 'Não foi possível carregar as propostas',
    description:
      'Ocorreu uma falha na comunicação com o servidor. Verifique sua conexão e tente novamente.',
    actionLabel: 'Tentar novamente',
  },
  permission_denied: {
    title: 'Acesso restrito',
    description:
      'Você precisa estar logado na conta vinculada à solicitação para visualizar as propostas.',
    actionLabel: 'Fazer login',
    actionHref: '/auth/login',
  },
  offline: {
    title: 'Você está offline',
    description: 'Conecte-se à internet para carregar e interagir com as propostas.',
    actionLabel: 'Recarregar página',
  },
  draft_pending: {
    title: 'Aguardando proposta da empresa',
    description:
      'A empresa recebeu sua solicitação e está preparando a proposta técnica personalizada.',
  },
};
