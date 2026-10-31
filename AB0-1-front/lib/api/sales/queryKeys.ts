export const salesKeys = {
  all: ['sales'] as const,
  pipelines: () => [...salesKeys.all, 'pipelines'] as const,
  pipelineDetail: (id: string | number) => [...salesKeys.pipelines(), id] as const,
  pipelineBoards: () => [...salesKeys.all, 'pipeline-boards'] as const,
  pipelineBoardBase: (id: string | number) => [...salesKeys.pipelineBoards(), id] as const,
  pipelineBoard: (id: string | number, params: object = {}) =>
    [...salesKeys.pipelineBoardBase(id), params] as const,
  opportunities: (filters?: Record<string, unknown>) => [...salesKeys.all, 'opportunities', filters || {}] as const,
  opportunityDetail: (id: string | number) => [...salesKeys.all, 'opportunity', id] as const,
  accounts: (search?: string) => [...salesKeys.all, 'accounts', search || ''] as const,
  accountOptions: (search?: string) => [...salesKeys.all, 'account-options', search || ''] as const,
  accountDetail: (id: string | number) => [...salesKeys.all, 'account', id] as const,
  accountTimeline: (id: string | number, params?: Record<string, unknown>) =>
    [...salesKeys.accountDetail(id), 'timeline', params || {}] as const,
  contacts: (accountId?: string | number) => [...salesKeys.all, 'contacts', accountId || ''] as const,
  contactDetail: (id: string | number) => [...salesKeys.all, 'contact', id] as const,
  tasks: (filters?: Record<string, unknown>) => [...salesKeys.all, 'tasks', filters || {}] as const,
  today: () => [...salesKeys.all, 'today'] as const,
  opportunitiesMap: (params?: Record<string, unknown>) =>
    [...salesKeys.all, 'opportunities-map', params || {}] as const,
};
