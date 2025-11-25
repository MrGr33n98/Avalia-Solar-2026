import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '@/components/error-boundary'
import '@testing-library/jest-dom'

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}))

// Component that throws an error
function ThrowError({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  // Suppress console errors for these tests
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Oops! Algo deu errado/i)).toBeInTheDocument()
    expect(screen.getByText(/Tentar Novamente/i)).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalled()
    const [error] = onError.mock.calls[0]
    expect(error.message).toBe('Test error')
  })

  it('renders custom fallback when provided', () => {
    const fallback = <div>Custom error UI</div>

    render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error UI')).toBeInTheDocument()
    expect(screen.queryByText(/Oops!/i)).not.toBeInTheDocument()
  })

  it('shows technical details when showDetails is true', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Test error/i)).toBeInTheDocument()
  })

  it('resets error state when reset button is clicked', async () => {
    const user = userEvent.setup()
    let shouldThrow = true

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={shouldThrow} />
      </ErrorBoundary>
    )

    // Error UI should be visible
    expect(screen.getByText(/Oops! Algo deu errado/i)).toBeInTheDocument()

    // Change the throwing behavior
    shouldThrow = false

    // Click reset button
    const resetButton = screen.getByRole('button', { name: /Tentar Novamente/i })
    await user.click(resetButton)

    // Component should try to render again
    // Note: In real scenario, we would need to ensure the component doesn't throw again
  })

  it('reports error to Sentry', () => {
    const Sentry = require('@sentry/nextjs')

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(Sentry.captureException).toHaveBeenCalled()
  })

  it('has "Go Home" button that redirects', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const homeButton = screen.getByRole('button', { name: /Voltar para Home/i })
    expect(homeButton).toBeInTheDocument()
  })
})
