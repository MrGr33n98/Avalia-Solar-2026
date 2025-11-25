'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'gray' | 'white' | 'green' | 'red';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

/**
 * Loading Spinner Component - TASK-026
 * 
 * Componente de loading universal com várias opções
 * 
 * @param size - Tamanho do spinner (sm, md, lg, xl)
 * @param color - Cor do spinner
 * @param text - Texto opcional para exibir
 * @param fullScreen - Se true, ocupa a tela toda
 * @param className - Classes CSS adicionais
 */
export default function LoadingSpinner({
  size = 'md',
  color = 'blue',
  text,
  fullScreen = false,
  className = '',
}: LoadingSpinnerProps) {
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4',
  };

  // Color classes
  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    green: 'border-green-600 border-t-transparent',
    red: 'border-red-600 border-t-transparent',
  };

  const spinner = (
    <div
      className={`
        animate-spin rounded-full
        ${sizeClasses[size]}
        ${colorClasses[color]}
        ${className}
      `}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4">
          {spinner}
          {text && (
            <p className="text-sm font-medium text-gray-700 animate-pulse">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex flex-col items-center space-y-3">
        {spinner}
        <p className="text-sm font-medium text-gray-700">{text}</p>
      </div>
    );
  }

  return spinner;
}

/**
 * Loading Skeleton Component
 */
interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
  avatar?: boolean;
}

export function LoadingSkeleton({ 
  lines = 3, 
  className = '',
  avatar = false 
}: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {avatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="rounded-full bg-gray-300 h-12 w-12"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gray-300 rounded"
            style={{ width: `${100 - i * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Loading Button State
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function LoadingButton({
  loading = false,
  children,
  loadingText,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center
        px-4 py-2 border border-transparent text-sm font-medium rounded-md
        text-white bg-blue-600 hover:bg-blue-700
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading && (
        <LoadingSpinner size="sm" color="white" className="mr-2" />
      )}
      {loading ? loadingText || children : children}
    </button>
  );
}

/**
 * Loading Card
 */
export function LoadingCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <LoadingSkeleton lines={4} avatar />
    </div>
  );
}

/**
 * Loading Table Rows
 */
export function LoadingTableRows({ 
  rows = 5, 
  columns = 4 
}: { 
  rows?: number; 
  columns?: number; 
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Loading Grid Items
 */
export function LoadingGrid({ 
  items = 6,
  className = '' 
}: { 
  items?: number;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}
