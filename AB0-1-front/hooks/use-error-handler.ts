import { useState, useCallback } from 'react'
import { logError, formatError, type ErrorContext, type FormattedError } from '@/lib/error-handler'
import { toast } from 'sonner'

/**
 * Hook for handling errors in components
 * 
 * @example
 * ```tsx
 * const { handleError, error, clearError, isError } = useErrorHandler()
 * 
 * try {
 *   await somethingDangerous()
 * } catch (err) {
 *   handleError(err, { component: 'MyComponent', action: 'fetchData' })
 * }
 * ```
 */
export function useErrorHandler(defaultContext?: ErrorContext) {
  const [error, setError] = useState<FormattedError | null>(null)

  const handleError = useCallback((
    err: unknown,
    context?: ErrorContext
  ) => {
    const error = err instanceof Error ? err : new Error(String(err))
    
    // Log to Sentry and console
    logError(error, {
      ...defaultContext,
      ...context,
    })

    // Format for display
    const formatted = formatError(error)
    setError(formatted)

    // Show toast notification
    toast.error(formatted.message, {
      description: formatted.technical,
      action: formatted.canRetry ? {
        label: 'Tentar Novamente',
        onClick: () => {
          clearError()
          // Callback for retry can be passed
        },
      } : undefined,
    })

    return formatted
  }, [defaultContext])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    handleError,
    clearError,
    isError: error !== null,
  }
}

/**
 * Hook for handling async operations with error handling
 * 
 * @example
 * ```tsx
 * const { execute, loading, error } = useAsyncError()
 * 
 * const fetchData = async () => {
 *   const data = await execute(
 *     () => api.getData(),
 *     { component: 'MyComponent', action: 'fetchData' }
 *   )
 *   return data
 * }
 * ```
 */
export function useAsyncError<T = any>(defaultContext?: ErrorContext) {
  const [loading, setLoading] = useState(false)
  const { error, handleError, clearError } = useErrorHandler(defaultContext)

  const execute = useCallback(async (
    fn: () => Promise<T>,
    context?: ErrorContext
  ): Promise<T | undefined> => {
    setLoading(true)
    clearError()

    try {
      const result = await fn()
      setLoading(false)
      return result
    } catch (err) {
      setLoading(false)
      handleError(err, context)
      return undefined
    }
  }, [handleError, clearError])

  return {
    execute,
    loading,
    error,
    clearError,
  }
}

/**
 * Hook for retry logic with exponential backoff
 * 
 * @example
 * ```tsx
 * const { retry, loading, attempts, error } = useRetry()
 * 
 * const fetchWithRetry = async () => {
 *   await retry(
 *     () => api.getData(),
 *     { maxRetries: 3, delay: 1000 }
 *   )
 * }
 * ```
 */
export function useRetry<T = any>(defaultContext?: ErrorContext) {
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const { error, handleError, clearError } = useErrorHandler(defaultContext)

  const retry = useCallback(async (
    fn: () => Promise<T>,
    options: {
      maxRetries?: number
      delay?: number
      backoff?: number
      context?: ErrorContext
    } = {}
  ): Promise<T | undefined> => {
    const {
      maxRetries = 3,
      delay = 1000,
      backoff = 2,
      context,
    } = options

    setLoading(true)
    clearError()
    setAttempts(0)

    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
      try {
        setAttempts(i + 1)
        const result = await fn()
        setLoading(false)
        return result
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        
        if (i < maxRetries - 1) {
          const waitTime = delay * Math.pow(backoff, i)
          toast.info(`Tentando novamente (${i + 2}/${maxRetries})...`, {
            duration: waitTime,
          })
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }

    setLoading(false)
    if (lastError) {
      handleError(lastError, {
        ...context,
        metadata: {
          ...context?.metadata,
          attempts: maxRetries,
          action: 'retry_failed',
        },
      })
    }

    return undefined
  }, [handleError, clearError])

  return {
    retry,
    loading,
    attempts,
    error,
    clearError,
  }
}

export default useErrorHandler
