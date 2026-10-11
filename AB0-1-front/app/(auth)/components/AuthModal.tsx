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

import { resolveSurfaceFromHost, getSurfaceInfo } from '@/lib/host-context';

interface AuthModalProps {
  initialTab: 'login' | 'register';
}

export default function AuthModal({ initialTab }: AuthModalProps) {
  const router = useRouter();
  const [surfaceInfo, setSurfaceInfo] = useState(() =>
    getSurfaceInfo(resolveSurfaceFromHost(typeof window !== 'undefined' ? window.location.host : ''))
  );
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);
  const [registerType, setRegisterType] = useState<'user' | 'company'>('user');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = getSurfaceInfo(resolveSurfaceFromHost(window.location.host));
      setSurfaceInfo(info);
      if (info.isCrm) {
        setActiveTab('login');
      }
    }
  }, []);

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
    if (surfaceInfo.isCrm) return;
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
            initial={{ y: 16, opacity: 0, scale: 0.985 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Autenticação"
            className={`relative z-10 flex w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.35)] md:flex-row ${
              activeTab === 'login'
                ? 'h-auto max-h-[calc(100dvh-24px)] md:max-h-[min(620px,calc(100dvh-48px))]'
                : 'h-[calc(100dvh-24px)] md:h-[min(680px,calc(100dvh-48px))]'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-3.5 top-3.5 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 md:right-4 md:top-4"
              aria-label="Fechar autenticação"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Left Column - Branding & Benefits */}
            <div className="hidden w-[36%] border-r border-slate-200 md:flex md:flex-col">
              <AuthBenefits tab={activeTab} />
            </div>

            {/* Mobile Header (Compact Branding) */}
            <div className="flex h-12 items-center border-b border-slate-200 bg-slate-50/70 px-5 md:hidden">
              <BrandLogo className="h-7 w-auto" sizes="120px" priority />
            </div>

            {/* Right Column - Tabs & Content */}
            <div
              className={`flex min-h-0 w-full flex-col bg-white md:w-[64%] ${
                activeTab === 'login' ? 'h-auto' : 'h-full'
              }`}
            >
              <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className={`flex flex-col ${activeTab === 'login' ? 'h-auto' : 'h-full'}`}
              >
                {!surfaceInfo.isCrm && (
                  <div className="px-5 pb-1.5 pt-4 sm:px-8 md:px-7 md:pt-4">
                    <TabsList className="mx-auto grid h-10 w-full max-w-[360px] grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-0.5 shadow-none">
                      <TabsTrigger
                        value="login"
                        className="h-full rounded-md border-b-2 border-transparent text-xs font-semibold text-slate-600 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm sm:text-sm"
                      >
                        Entrar
                      </TabsTrigger>
                      <TabsTrigger
                        value="register"
                        className="h-full rounded-md border-b-2 border-transparent text-xs font-semibold text-slate-600 shadow-none data-[state=active]:border-blue-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm sm:text-sm"
                      >
                        Criar conta
                      </TabsTrigger>
                    </TabsList>
                  </div>
                )}

                <div className={`relative ${activeTab === 'login' ? 'h-auto' : 'flex-1 overflow-hidden'}`}>
                  <TabsContent value="login" className="m-0 data-[state=inactive]:hidden">
                    <motion.div
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2 }}
                    >
                      <LoginTab onCreateAccount={() => handleTabChange('register')} />
                    </motion.div>
                  </TabsContent>

                  <TabsContent
                    value="register"
                    className="h-full m-0 data-[state=inactive]:hidden flex flex-col"
                  >
                    <div className="px-5 pb-1 pt-2 sm:px-8 md:px-7">
                      <div className="mx-auto flex max-w-[360px] rounded-lg border border-slate-200 bg-slate-50 p-1">
                        <button
                          onClick={() => setRegisterType('user')}
                          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all sm:text-sm ${
                            registerType === 'user'
                              ? 'bg-white text-blue-700 shadow-sm'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          Para Você
                        </button>
                        <button
                          onClick={() => setRegisterType('company')}
                          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all sm:text-sm ${
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
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.2 }}
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
