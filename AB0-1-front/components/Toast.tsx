'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/solid';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => void;
  error: (title: string, message?: string, duration?: number) => void;
  warning: (title: string, message?: string, duration?: number) => void;
  info: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast Provider - TASK-027
 * 
 * Provedor global de notificações toast
 * Wrap your app with this provider
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Helper methods
  const success = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'success', title, message, duration });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'error', title, message, duration });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'warning', title, message, duration });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, duration?: number) => {
    addToast({ type: 'info', title, message, duration });
  }, [addToast]);

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook to use Toast
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Toast Container - Renders all toasts
 */
function ToastContainer({ 
  toasts, 
  removeToast 
}: { 
  toasts: Toast[]; 
  removeToast: (id: string) => void;
}) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

/**
 * Individual Toast Item
 */
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = getToastConfig(toast.type);

  return (
    <div
      className={`
        pointer-events-auto w-96 max-w-full rounded-lg shadow-lg overflow-hidden
        transform transition-all duration-300 ease-in-out
        animate-slide-in
        ${config.bgColor} ${config.borderColor} border-l-4
      `}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {config.icon}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${config.titleColor}`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className={`mt-1 text-sm ${config.messageColor}`}>
                {toast.message}
              </p>
            )}
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className={`mt-2 text-sm font-medium ${config.actionColor} hover:underline`}
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className={`
                inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2
                ${config.closeButtonColor}
              `}
              aria-label="Fechar notificação"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get toast configuration based on type
 */
function getToastConfig(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-400',
        titleColor: 'text-green-800',
        messageColor: 'text-green-700',
        actionColor: 'text-green-800',
        closeButtonColor: 'text-green-500 hover:text-green-600 focus:ring-green-500',
        icon: <CheckCircleIcon className="h-6 w-6 text-green-400" aria-hidden="true" />,
      };
    case 'error':
      return {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-400',
        titleColor: 'text-red-800',
        messageColor: 'text-red-700',
        actionColor: 'text-red-800',
        closeButtonColor: 'text-red-500 hover:text-red-600 focus:ring-red-500',
        icon: <XCircleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />,
      };
    case 'warning':
      return {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-400',
        titleColor: 'text-yellow-800',
        messageColor: 'text-yellow-700',
        actionColor: 'text-yellow-800',
        closeButtonColor: 'text-yellow-500 hover:text-yellow-600 focus:ring-yellow-500',
        icon: <ExclamationCircleIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />,
      };
    case 'info':
    default:
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-400',
        titleColor: 'text-blue-800',
        messageColor: 'text-blue-700',
        actionColor: 'text-blue-800',
        closeButtonColor: 'text-blue-500 hover:text-blue-600 focus:ring-blue-500',
        icon: <InformationCircleIcon className="h-6 w-6 text-blue-400" aria-hidden="true" />,
      };
  }
}

/**
 * Standalone toast function (without provider)
 * Use this for simple cases outside React components
 */
export const toast = {
  success: (title: string, message?: string) => {
    console.log('[Toast Success]', title, message);
  },
  error: (title: string, message?: string) => {
    console.error('[Toast Error]', title, message);
  },
  warning: (title: string, message?: string) => {
    console.warn('[Toast Warning]', title, message);
  },
  info: (title: string, message?: string) => {
    console.info('[Toast Info]', title, message);
  },
};
