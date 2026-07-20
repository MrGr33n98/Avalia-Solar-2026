import { create } from 'zustand';

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  notifiable?: {
    type: string;
    id: number;
    company_id?: number;
  };
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  unreadMessagesCount: number;
  loading: boolean;
  
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  fetchUnreadMessagesCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  unreadMessagesCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/v1/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      set({ 
        notifications: data.data || [],
        unreadCount: data.meta?.unread_count ?? 0,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await fetch('/api/v1/notifications/unread_count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch unread count');

      const data = await response.json();
      set({ unreadCount: data.unread_count || 0 });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  fetchUnreadMessagesCount: async () => {
    try {
      const response = await fetch('/api/v1/conversations/unread_count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch unread messages count');

      const data = await response.json();
      set({ unreadMessagesCount: data.unread_count || 0 });
    } catch (error) {
      console.error('Failed to fetch unread messages count:', error);
    }
  },

  markAsRead: async (id: number) => {
    try {
      const response = await fetch(`/api/v1/notifications/${id}/mark_as_read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await fetch('/api/v1/notifications/mark_all_as_read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },
}));
