'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrandLogo } from '@/components/brand/BrandLogo';

import AuthBenefits from './AuthBenefits';
import LoginTab from './LoginTab';
import RegisterCompanyTab from './RegisterCompanyTab';
import RegisterUserTab from './RegisterUserTab';

interface AuthModalProps {
  initialTab: 'login' | 'register';
}

export default function AuthModal({ initialTab }: AuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [registerType, setRegisterType] = useState<'user' | 'company'>('user');
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      router.push('/');
    }, 300);
  }, [router]);

  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = 'hidden';

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [handleClose]);

  const handleTabChange = (value: string) => {
    const newTab = value as 'login' | 'register';
    setActiveTab(newTab);
    // Update URL without full reload
    router.replace(`/${newTab}`);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-[3px]"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: 18, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="relative z-10 flex h-[calc(100dvh-24px)] w-full max-w-[1120px] flex-col overflow-hidden rounded-xl border border-white/20 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.42)] md:h-[min(780px,calc(100dvh-48px))] md:flex-row md:rounded-sm"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 md:right-6 md:top-6"
              aria-label="Fechar autenticação"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column - Branding & Benefits */}
            <div className="hidden h-full w-[40%] border-r border-slate-200 md:block">
              <AuthBenefits tab={activeTab} />
            </div>

            {/* Mobile Header (Compact Branding) */}
            <div className="flex h-16 items-center border-b border-slate-200 bg-slate-50/70 px-5 md:hidden">
              <BrandLogo className="h-8" sizes="139px" priority />
            </div>

            {/* Right Column - Tabs & Content */}
            <div className="flex h-full min-h-0 w-full flex-col bg-white md:w-[60%]">
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="flex flex-col h-full"
              >
                <div className="px-5 pb-2 pt-5 sm:px-10 md:px-12 md:pt-11">
                  <TabsList className="mx-auto grid h-12 w-full max-w-[430px] grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-0 shadow-none">
                    <TabsTrigger
                      value="login"
                      className="h-full rounded-md border-b-2 border-transparent text-sm font-semibold text-slate-600 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                    >
                      Entrar
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className="h-full rounded-md border-b-2 border-transparent text-sm font-semibold text-slate-600 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                    >
                      Criar conta
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden relative">
                  <TabsContent value="login" className="h-full m-0 data-[state=inactive]:hidden">
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="h-full"
                    >
                      <LoginTab onCreateAccount={() => handleTabChange('register')} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent
                    value="register"
                    className="h-full m-0 data-[state=inactive]:hidden flex flex-col"
                  >
                    <div className="px-5 pb-1 pt-3 sm:px-10 md:px-12">
                      <div className="mx-auto flex max-w-[430px] rounded-md border border-slate-200 bg-slate-50 p-1">
                        <button
                          onClick={() => setRegisterType('user')}
                          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                            registerType === 'user'
                              ? 'bg-white text-blue-700 shadow-sm'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Para Você
                        </button>
                        <button
                          onClick={() => setRegisterType('company')}
                          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                            registerType === 'company'
                              ? 'bg-white text-blue-700 shadow-sm'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Para Empresas
                        </button>
                      </div>
                    </div>
                    <motion.div
                      key={registerType}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="h-full overflow-hidden"
                    >
                      {registerType === 'user' ? <RegisterUserTab /> : <RegisterCompanyTab />}
                    </motion.div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
