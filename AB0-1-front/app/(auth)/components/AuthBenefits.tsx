'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Star, TrendingUp, Search, ShieldCheck, UserCheck } from 'lucide-react';
import Image from 'next/image';

interface AuthBenefitsProps {
  tab: 'login' | 'register';
}

export default function AuthBenefits({ tab }: AuthBenefitsProps) {
  const isLogin = tab === 'login';

  const benefits = isLogin
    ? [
        {
          icon: ShieldCheck,
          title: 'Acesso Seguro',
          description: 'Seus dados e avaliações protegidos com segurança de ponta a ponta.'
        },
        {
          icon: Star,
          title: 'Gerencie suas Avaliações',
          description: 'Acompanhe o feedback dos seus clientes e melhore sua reputação.'
        },
        {
          icon: UserCheck,
          title: 'Perfil Personalizado',
          description: 'Mantenha suas informações atualizadas e destaque-se no mercado.'
        }
      ]
    : [
        {
          icon: TrendingUp,
          title: 'Receba leads qualificados',
          description: 'Conecte-se com clientes que buscam exatamente o que você oferece.'
        },
        {
          icon: Star,
          title: 'Ganhe avaliações e prova social',
          description: 'Construa reputação e confiança com reviews autênticos.'
        },
        {
          icon: Search,
          title: 'Apareça nas buscas',
          description: 'Melhore sua visibilidade e seja encontrado por novos clientes.'
        }
      ];

  return (
    <div className="h-full bg-slate-50 p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10">
        <div className="mb-8">
           {/* Logo Placeholder - Usando asset real do projeto se disponível, senão texto */}
           <div className="flex items-center gap-2 mb-6">
             <Image 
                src="/images/logo.png" 
                alt="Avalia Solar Logo" 
                width={150} 
                height={40} 
                className="h-10 w-auto object-contain"
                onError={(e) => {
                    // Fallback se a imagem não carregar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if(parent) {
                        // Check if fallback already exists to avoid duplication
                        if (!parent.querySelector('.fallback-text')) {
                            const textNode = document.createElement('span');
                            textNode.className = 'text-2xl font-bold text-emerald-600 fallback-text';
                            textNode.innerText = 'Avalia Solar';
                            parent.appendChild(textNode);
                        }
                    }
                }}
             />
           </div>
          
          <AnimatePresence mode="wait">
            <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
                    {isLogin ? (
                        <>Bem-vindo de volta ao <span className="text-emerald-600">Avalia Solar</span></>
                    ) : (
                        <>Cadastre sua empresa no <span className="text-emerald-600">Avalia Solar</span></>
                    )}
                </h1>
                
                <p className="text-slate-600 text-lg">
                    {isLogin 
                        ? 'Acesse sua conta para gerenciar avaliações e configurações.' 
                        : 'Junte-se à maior plataforma de avaliação de energia solar do Brasil.'
                    }
                </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Benefits List */}
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tab}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="space-y-6"
                >
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-600">
                        <benefit.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{benefit.title}</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
            </AnimatePresence>
        </div>
      </div>

      {/* Footer / Trust Indicators */}
      <div className="relative z-10 pt-8 mt-8 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{isLogin ? 'Login seguro e criptografado' : 'Cadastro gratuito e seguro'}</span>
        </div>
      </div>
    </div>
  );
}
