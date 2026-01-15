'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import RegisterBenefits from './RegisterBenefits';
import CompanyRegisterForm from './CompanyRegisterForm';
import RegisterSuccess from './RegisterSuccess';

export default function RegisterModal() {
  const router = useRouter();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after mount
    setIsVisible(true);

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Handle ESC key
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      router.push('/');
    }, 300); // Wait for exit animation
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[980px] h-[90vh] sm:h-[85vh] max-h-[800px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 p-2 bg-white/80 hover:bg-white rounded-full text-slate-500 hover:text-slate-900 transition-colors shadow-sm backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column - Branding & Benefits (Hidden on small mobile if needed, or stacked) */}
            <div className="hidden md:block w-full md:w-5/12 h-full border-r border-slate-100">
              <RegisterBenefits />
            </div>

            {/* Right Column - Form or Success State */}
            <div className="w-full md:w-7/12 h-full relative bg-white">
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <CompanyRegisterForm onSuccess={() => setIsSuccess(true)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="h-full"
                  >
                    <RegisterSuccess onReset={() => setIsSuccess(false)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
