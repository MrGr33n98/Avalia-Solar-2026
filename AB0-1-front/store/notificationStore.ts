import { create } from 'zustand';

export interface Notification {
  id: number;
  type: string;
  category?: 'quotes' | 'reviews' | 'messages' | 'companies' | 'system';
  title: string;
  body: string;
  read: boolean;
  archived?: boolean;
  created_at: string;
  cta_label?: string;
  destination_url?: string;
  company_name?: string;
  company_logo_url?: string;
  notifiable?: {
    type: string;
    id: number;
    company_id?: number;
  };
}

export interface NotificationPreference {
  id?: number;
  event_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  whatsapp_enabled: boolean;
  frequency: 'immediately' | 'daily_digest' | 'weekly_digest';
  consent_version?: string;
  consented_at?: string;
}

export type NotificationFilter = 'all' | 'unread' | 'quotes' | 'reviews' | 'messages' | 'companies' | 'system';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  unreadMessagesCount: number;
  loading: boolean;
  filterCounts: Record<NotificationFilter, number>;
  activeFilter: NotificationFilter;

  preferences: NotificationPreference[];
  preferencesLoading: boolean;

  chatState: 'closed' | 'minimized' | 'expanded';
  activeTab: 'priority' | 'budgets' | 'other';
  setActiveTab: (tab: 'priority' | 'budgets' | 'other') => void;
  setActiveFilter: (filter: NotificationFilter) => void;

  fetchNotifications: (filter?: NotificationFilter) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchUnreadMessagesCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: number) => Promise<void>;
  unarchiveNotification: (id: number) => Promise<void>;

  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreference>[]) => Promise<void>;

  toggleChat: (state?: 'closed' | 'minimized' | 'expanded') => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  unreadMessagesCount: 0,
  loading: false,
  filterCounts: {
    all: 0,
    unread: 0,
    quotes: 0,
    reviews: 0,
    messages: 0,
    companies: 0,
    system: 0,
  },
  activeFilter: 'all',
  preferences: [],
  preferencesLoading: false,

  chatState: 'minimized',
  activeTab: 'priority',
  setActiveTab: (tab) => set({ activeTab: tab }),
  setActiveFilter: (filter) => {
    set({ activeFilter: filter });
    get().fetchNotifications(filter);
  },

  fetchNotifications: async (filter = get().activeFilter) => {
    set({ loading: true });
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const url = filter && filter !== 'all' 
        ? `/api/v1/notifications?filter=${filter}` 
        : '/api/v1/notifications';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      set({ 
        notifications: data.data || [],
        unreadCount: data.meta?.unread_count ?? 0,
        filterCounts: data.meta?.counts || get().filterCounts,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.avaliasolar.com.br';
      const response = await fetch(`${baseUrl}/api/v1/notifications/unread_count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      set({ unreadCount: data.unread_count || 0 });
    } catch {
      // Silent catch for network or auth polling errors
    }
  },

  fetchUnreadMessagesCount: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.avaliasolar.com.br';
      const response = await fetch(`${baseUrl}/api/v1/conversations/unread_count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      set({ unreadMessagesCount: data.unread_count || 0 });
    } catch {
      // Silent catch for network or auth polling errors
    }
  },

  markAsRead: async (id: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`/api/v1/notifications/${id}/mark_as_read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        filterCounts: {
          ...state.filterCounts,
          unread: Math.max(0, state.filterCounts.unread - 1),
        },
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/v1/notifications/mark_all_as_read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
        filterCounts: {
          ...state.filterCounts,
          unread: 0,
        },
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  archiveNotification: async (id: number) => {
    // Optimistic removal
    const previousList = get().notifications;
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`/api/v1/notifications/${id}/archive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        set({ notifications: previousList });
        throw new Error('Failed to archive notification');
      }
    } catch (error) {
      console.error('Failed to archive notification:', error);
      set({ notifications: previousList });
    }
  },

  unarchiveNotification: async (id: number) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`/api/v1/notifications/${id}/unarchive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to unarchive notification');
      get().fetchNotifications();
    } catch (error) {
      console.error('Failed to unarchive notification:', error);
    }
  },

  fetchPreferences: async () => {
    set({ preferencesLoading: true });
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/v1/notification_preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch notification preferences');

      const data = await response.json();
      set({ preferences: data.preferences || [], preferencesLoading: false });
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      set({ preferencesLoading: false });
    }
  },

  updatePreferences: async (prefs) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch('/api/v1/notification_preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences: prefs }),
      });

      if (!response.ok) throw new Error('Failed to update notification preferences');

      const data = await response.json();
      set({ preferences: data.preferences || [] });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  },

  toggleChat: (state?: 'closed' | 'minimized' | 'expanded') => {
    set((current) => {
      if (state) return { chatState: state };
      if (current.chatState === 'closed') return { chatState: 'expanded' };
      if (current.chatState === 'expanded') return { chatState: 'minimized' };
      return { chatState: 'expanded' };
    });
  }
}));
