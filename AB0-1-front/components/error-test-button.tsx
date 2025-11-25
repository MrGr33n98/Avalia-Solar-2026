'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

/**
 * Error Test Button
 * 
 * Component for testing Error Boundaries in development.
 * Only visible in development mode.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 *   <ErrorTestButton />
 * </ErrorBoundary>
 * ```
 */
export function ErrorTestButton() {
  const [shouldThrow, setShouldThrow] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (shouldThrow) {
    throw new Error('Test Error - This is a simulated error for testing Error Boundary')
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={() => setShouldThrow(true)}
        variant="destructive"
        size="sm"
        className="shadow-lg"
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Test Error Boundary
      </Button>
    </div>
  )
}

export default ErrorTestButton
