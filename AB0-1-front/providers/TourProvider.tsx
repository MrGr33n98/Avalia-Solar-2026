'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { startDashboardTour, isTourCompleted, resetTour as resetTourStorage } from '@/lib/tour';

interface TourContextType {
  isCompleted: boolean;
  startTour: () => void;
  resetTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isCompleted, setIsCompleted] = useState(true);

  useEffect(() => {
    setIsCompleted(isTourCompleted());
  }, []);

  const startTour = () => {
    startDashboardTour(() => {
      setIsCompleted(true);
    });
  };

  const resetTour = () => {
    resetTourStorage();
    setIsCompleted(false);
    startTour();
  };

  useEffect(() => {
    if (!isCompleted) {
      const timer = setTimeout(() => {
        startTour();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCompleted]);

  return (
    <TourContext.Provider value={{ isCompleted, startTour, resetTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within TourProvider');
  }
  return context;
}
