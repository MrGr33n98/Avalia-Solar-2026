import {
  logError,
  handleApiError,
  getUserFriendlyMessage,
  isRecoverableError,
  formatError,
} from '@/lib/error-handler'

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}))

describe('Error Handler Utils', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('logError', () => {
    it('logs error to console', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation()
      const error = new Error('Test error')

      logError(error, { component: 'TestComponent' })

      expect(consoleError).toHaveBeenCalled()
      consoleError.mockRestore()
    })

    it('sends error to Sentry with context', () => {
      const Sentry = require('@sentry/nextjs')
      const error = new Error('Test error')

      logError(error, {
        component: 'TestComponent',
        action: 'testAction',
        userId: 'user123',
      })

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            component: 'TestComponent',
            action: 'testAction',
          },
          user: { id: 'user123' },
        })
      )
    })
  })

  describe('handleApiError', () => {
    it('handles error with response', () => {
      const apiError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Resource not found' },
        },
      }

      const result = handleApiError(apiError, { component: 'TestComponent' })

      expect(result.message).toBe('Resource not found')
    })

    it('handles error without response', () => {
      const apiError = {
        request: {},
        message: 'Network Error',
      }

      const result = handleApiError(apiError, { component: 'TestComponent' })

      expect(result.message).toBe('Não foi possível conectar ao servidor')
    })

    it('handles generic error', () => {
      const apiError = {
        message: 'Something went wrong',
      }

      const result = handleApiError(apiError, { component: 'TestComponent' })

      expect(result.message).toBe('Something went wrong')
    })
  })

  describe('getUserFriendlyMessage', () => {
    it('returns friendly message for network error', () => {
      const error = new Error('Network Error')
      const message = getUserFriendlyMessage(error)

      expect(message).toBe('Problema de conexão. Verifique sua internet.')
    })

    it('returns friendly message for timeout', () => {
      const error = new Error('Request timeout exceeded')
      const message = getUserFriendlyMessage(error)

      expect(message).toBe('A operação demorou muito. Tente novamente.')
    })

    it('returns friendly message for unauthorized', () => {
      const error = new Error('Unauthorized access')
      const message = getUserFriendlyMessage(error)

      expect(message).toBe('Você precisa fazer login para continuar.')
    })

    it('returns generic message for unknown error', () => {
      const error = new Error('Unknown error')
      const message = getUserFriendlyMessage(error)

      expect(message).toBe('Ocorreu um erro. Tente novamente.')
    })
  })

  describe('isRecoverableError', () => {
    it('identifies network errors as recoverable', () => {
      const error = new Error('Network Error')
      expect(isRecoverableError(error)).toBe(true)
    })

    it('identifies timeout as recoverable', () => {
      const error = new Error('Request timeout')
      expect(isRecoverableError(error)).toBe(true)
    })

    it('identifies ECONNREFUSED as recoverable', () => {
      const error = new Error('ECONNREFUSED')
      expect(isRecoverableError(error)).toBe(true)
    })

    it('identifies other errors as non-recoverable', () => {
      const error = new Error('Syntax error')
      expect(isRecoverableError(error)).toBe(false)
    })
  })

  describe('formatError', () => {
    it('formats error with user-friendly message', () => {
      const error = new Error('Network Error')
      const formatted = formatError(error)

      expect(formatted.title).toBe('Erro')
      expect(formatted.message).toBe('Problema de conexão. Verifique sua internet.')
      expect(formatted.canRetry).toBe(true)
    })

    it('includes technical details in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Test error')
      const formatted = formatError(error)

      expect(formatted.technical).toBe('Test error')

      process.env.NODE_ENV = originalEnv
    })

    it('excludes technical details in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const error = new Error('Test error')
      const formatted = formatError(error)

      expect(formatted.technical).toBeUndefined()

      process.env.NODE_ENV = originalEnv
    })

    it('marks non-recoverable errors correctly', () => {
      const error = new Error('Syntax error')
      const formatted = formatError(error)

      expect(formatted.canRetry).toBe(false)
    })
  })
})
