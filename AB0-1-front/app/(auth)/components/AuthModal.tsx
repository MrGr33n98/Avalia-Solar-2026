'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[980px] h-[90vh] sm:h-[85vh] max-h-[800px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row z-10"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 p-2 bg-white/80 hover:bg-white rounded-full text-slate-500 hover:text-slate-900 transition-colors shadow-sm backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column - Branding & Benefits */}
            <div className="hidden md:block w-full md:w-5/12 h-full border-r border-slate-100">
              <AuthBenefits tab={activeTab} />
            </div>

            {/* Mobile Header (Compact Branding) */}
            <div className="md:hidden p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900">Avalia Solar</span>
            </div>

            {/* Right Column - Tabs & Content */}
            <div className="w-full md:w-7/12 h-full flex flex-col bg-white">
                <Tabs 
                    value={activeTab} 
                    onValueChange={handleTabChange} 
                    className="flex flex-col h-full"
                >
                    <div className="px-8 pt-8 pb-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Entrar</TabsTrigger>
                            <TabsTrigger value="register">Criar conta</TabsTrigger>
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
                                <LoginTab />
                            </motion.div>
                        </TabsContent>
                        
                        <TabsContent value="register" className="h-full m-0 data-[state=inactive]:hidden flex flex-col">
                            <div className="px-8 pt-4 pb-2">
                                <div className="flex rounded-lg bg-slate-100 p-1">
                                    <button
                                        onClick={() => setRegisterType('user')}
                                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                                            registerType === 'user' 
                                            ? 'bg-white text-slate-900 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        Para Você
                                    </button>
                                    <button
                                        onClick={() => setRegisterType('company')}
                                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                                            registerType === 'company' 
                                            ? 'bg-white text-slate-900 shadow-sm' 
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
