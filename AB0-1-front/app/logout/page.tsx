'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type LogoutStatus = 'logging_out' | 'success' | 'error';

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<LogoutStatus>('logging_out');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  useEffect(() => {
    async function performLogout() {
      try {
        // Call logout API
        const response = await fetch('/api/v1/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          setStatus('success');
          
          // Clear all local storage
          if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear all cookies
            document.cookie.split(";").forEach((c) => {
              document.cookie = c.replace(/^ +/, "")
                .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
          }
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push('/login?logout=success');
          }, 1500);
        } else {
          const data = await response.json().catch(() => ({}));
          setErrorMessage(data.error || 'Logout failed');
          setStatus('error');
        }
      } catch (error) {
        console.error('Logout error:', error);
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setStatus('error');
        
        // Even if API call fails, clear local data
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
          });
        }
        
        // Redirect anyway after a delay
        setTimeout(() => {
          router.push('/login?logout=error');
        }, 2000);
      }
    }
    
    performLogout();
  }, [router]);
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
        {status === 'logging_out' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Saindo...</h1>
            <p className="text-gray-600">Aguarde enquanto encerramos sua sessão</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <svg 
                  className="h-16 w-16 text-green-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Logout realizado!</h1>
            <p className="text-gray-600 mb-4">Sua sessão foi encerrada com sucesso</p>
            <p className="text-sm text-gray-500">Redirecionando para o login...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-red-100 p-4">
                <svg 
                  className="h-16 w-16 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Erro ao fazer logout</h1>
            <p className="text-gray-600 mb-4">{errorMessage || 'Algo deu errado'}</p>
            <p className="text-sm text-gray-500 mb-6">Sua sessão local foi limpa</p>
            <button 
              onClick={() => router.push('/login')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ir para Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
