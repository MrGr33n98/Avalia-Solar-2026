import { useEffect, useState } from 'react';

export interface AppExperience {
  isMobile: boolean;
  isStandalone: boolean;
  isPwa: boolean;
  hasSafeArea: boolean;
  isTouch: boolean;
}

const initial: AppExperience = { isMobile: false, isStandalone: false, isPwa: false, hasSafeArea: false, isTouch: false };

export function useAppExperience(): AppExperience {
  const [experience, setExperience] = useState(initial);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)');
    const standalone = window.matchMedia('(display-mode: standalone)');
    const update = () => {
      const isStandalone = standalone.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setExperience({
        isMobile: mobile.matches,
        isStandalone,
        isPwa: isStandalone,
        hasSafeArea: CSS.supports('padding: env(safe-area-inset-top)'),
        isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      });
    };
    update();
    mobile.addEventListener('change', update);
    standalone.addEventListener('change', update);
    return () => { mobile.removeEventListener('change', update); standalone.removeEventListener('change', update); };
  }, []);

  return experience;
}
