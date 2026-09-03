export const salesKeys = {
  all: ['sales'] as const,
  pipelines: () => [...salesKeys.all, 'pipelines'] as const,
  pipelineDetail: (id: string | number) => [...salesKeys.pipelines(), id] as const,
  opportunities: (filters?: Record<string, any>) => [...salesKeys.all, 'opportunities', filters || {}] as const,
  opportunityDetail: (id: string | number) => [...salesKeys.all, 'opportunity', id] as const,
  accounts: (search?: string) => [...salesKeys.all, 'accounts', search || ''] as const,
  accountOptions: (search?: string) => [...salesKeys.all, 'account-options', search || ''] as const,
  accountDetail: (id: string | number) => [...salesKeys.all, 'account', id] as const,
  contacts: (accountId?: string | number) => [...salesKeys.all, 'contacts', accountId || ''] as const,
  contactDetail: (id: string | number) => [...salesKeys.all, 'contact', id] as const,
  tasks: (filters?: Record<string, any>) => [...salesKeys.all, 'tasks', filters || {}] as const,
  today: () => [...salesKeys.all, 'today'] as const,
};
