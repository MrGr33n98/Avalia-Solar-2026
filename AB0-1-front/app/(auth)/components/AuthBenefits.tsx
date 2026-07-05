'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BrandLogo } from '@/components/brand/BrandLogo';

interface AuthBenefitsProps {
  tab: 'login' | 'register';
}

export default function AuthBenefits({ tab }: AuthBenefitsProps) {
  const isLogin = tab === 'login';

  const benefits = isLogin
    ? [
        {
          title: 'Perfil comercial centralizado',
          description: 'Atualize dados, serviços e diferenciais da sua empresa.',
        },
        {
          title: 'Reputação em tempo real',
          description: 'Acompanhe avaliações, respostas e sinais de confiança.',
        },
        {
          title: 'Oportunidades organizadas',
          description: 'Centralize contatos, leads e solicitações comerciais.',
        },
      ]
    : [
        {
          title: 'Cadastro simples e seguro',
          description: 'Crie seu acesso com dados protegidos e validação confiável.',
        },
        {
          title: 'Reputação verificável',
          description: 'Avalie empresas ou administre a presença do seu negócio.',
        },
        {
          title: 'Tudo em um só lugar',
          description: 'Acompanhe perfis, avaliações e oportunidades comerciais.',
        },
      ];

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,#f8fbff_0%,#f4f7fb_58%,#eef5ff_100%)] px-10 py-10 lg:px-12">
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(37,99,235,0.06)_8px,rgba(37,99,235,0.06)_9px)]" />

      {/* Header */}
      <div className="relative z-10">
        <div className="mb-8">
          <div className="mb-10 flex items-center gap-2">
            <BrandLogo className="h-9" sizes="157px" priority />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                {isLogin ? 'Acesso seguro' : 'Comece agora'}
              </p>
              <h1 className="mb-4 max-w-[330px] text-[2.25rem] font-bold leading-[1.12] tracking-tight text-slate-950">
                {isLogin ? 'Acesse o Avalia Solar' : 'Crie sua conta no Avalia Solar'}
              </h1>

              <p className="max-w-[330px] text-[15px] leading-6 text-slate-600">
                {isLogin
                  ? 'Gerencie sua presença, avaliações e oportunidades comerciais em um ambiente seguro.'
                  : 'Escolha o tipo de conta e centralize sua experiência na plataforma.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Benefits List */}
        <div className="border-t border-slate-300/80">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="divide-y divide-slate-300/80"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="grid grid-cols-[48px_1fr] gap-4 py-5">
                  <span className="text-sm font-bold text-blue-600">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">{benefit.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / Trust Indicators */}
      <div className="relative z-10 mt-6 border-t border-slate-300/80 pt-7">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
          <span>{isLogin ? 'Login seguro e criptografado' : 'Cadastro gratuito e seguro'}</span>
        </div>
      </div>
    </div>
  );
}
