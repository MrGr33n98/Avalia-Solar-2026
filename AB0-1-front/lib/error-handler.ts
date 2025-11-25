import * as Sentry from '@sentry/nextjs'

/**
 * Error Handler Utilities
 * 
 * Centralized error handling and logging utilities.
 */

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, any>
}

/**
 * Log error to console and Sentry
 */
export function logError(
  error: Error,
  context?: ErrorContext
): void {
  console.error('[Error]', {
    message: error.message,
    stack: error.stack,
    context,
  })

  Sentry.captureException(error, {
    tags: {
      component: context?.component,
      action: context?.action,
    },
    user: context?.userId ? { id: context.userId } : undefined,
    contexts: {
      additional: context?.metadata,
    },
  })
}

/**
 * Handle API errors
 */
export function handleApiError(
  error: any,
  context?: ErrorContext
): Error {
  let errorMessage = 'Ocorreu um erro inesperado'
  let errorDetails: any = {}

  if (error.response) {
    // Server responded with error status
    errorMessage = error.response.data?.message || error.response.statusText
    errorDetails = {
      status: error.response.status,
      data: error.response.data,
    }
  } else if (error.request) {
    // Request made but no response
    errorMessage = 'Não foi possível conectar ao servidor'
    errorDetails = {
      request: error.request,
    }
  } else {
    // Error in request setup
    errorMessage = error.message
  }

  const handledError = new Error(errorMessage)
  
  logError(handledError, {
    ...context,
    metadata: {
      ...context?.metadata,
      ...errorDetails,
      originalError: error.toString(),
    },
  })

  return handledError
}

/**
 * Safe async function wrapper
 * Catches errors and logs them
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: ErrorContext,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn()
  } catch (error) {
    logError(
      error instanceof Error ? error : new Error(String(error)),
      context
    )
    return fallback
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number
    delay?: number
    backoff?: number
    context?: ErrorContext
  } = {}
): Promise<T> {
  const {
    retries = 3,
    delay = 1000,
    backoff = 2,
    context,
  } = options

  let lastError: Error

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (i < retries - 1) {
        const waitTime = delay * Math.pow(backoff, i)
        console.log(`Retry ${i + 1}/${retries} after ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }

  logError(lastError!, {
    ...context,
    metadata: {
      ...context?.metadata,
      retries,
      action: 'retry_failed',
    },
  })

  throw lastError!
}

/**
 * User-friendly error messages
 */
export function getUserFriendlyMessage(error: Error): string {
  const errorMap: Record<string, string> = {
    'Network Error': 'Problema de conexão. Verifique sua internet.',
    'timeout': 'A operação demorou muito. Tente novamente.',
    'Unauthorized': 'Você precisa fazer login para continuar.',
    'Forbidden': 'Você não tem permissão para esta ação.',
    'Not Found': 'O recurso solicitado não foi encontrado.',
    'Internal Server Error': 'Erro no servidor. Tente novamente mais tarde.',
    'Bad Request': 'Requisição inválida. Verifique os dados.',
  }

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.message.includes(key)) {
      return message
    }
  }

  return 'Ocorreu um erro. Tente novamente.'
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: Error): boolean {
  const recoverableErrors = [
    'Network Error',
    'timeout',
    'ECONNREFUSED',
    'ETIMEDOUT',
  ]

  return recoverableErrors.some(msg => 
    error.message.includes(msg)
  )
}

/**
 * Format error for display
 */
export interface FormattedError {
  title: string
  message: string
  canRetry: boolean
  technical?: string
}

export function formatError(error: Error): FormattedError {
  return {
    title: 'Erro',
    message: getUserFriendlyMessage(error),
    canRetry: isRecoverableError(error),
    technical: process.env.NODE_ENV === 'development' ? error.message : undefined,
  }
}

/**
 * Global error handler for unhandled promises
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason)
    
    Sentry.captureException(event.reason, {
      tags: {
        errorType: 'unhandledRejection',
      },
    })

    // Prevent default console error
    event.preventDefault()
  })

  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global Error:', event.error)
    
    Sentry.captureException(event.error, {
      tags: {
        errorType: 'globalError',
      },
    })
  })
}
