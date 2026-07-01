import { useEffect, useState } from 'react';

/**
 * Retorna true quando a largura da janela é menor que o breakpoint informado.
 * O SSR sempre retorna false (desktop-first seguro).
 * @param breakpoint Largura em px abaixo da qual considera mobile. Padrão: 1024 (lg do Tailwind)
 */
export function useIsMobile(breakpoint = 1024): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
}
