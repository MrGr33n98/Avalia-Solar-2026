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
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,#f8fbff_0%,#f4f7fb_58%,#eef5ff_100%)] px-6 py-6 lg:px-7">
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(37,99,235,0.06)_8px,rgba(37,99,235,0.06)_9px)]" />

      {/* Header */}
      <div className="relative z-10">
        <div className="mb-4">
          <div className="mb-4 flex items-center gap-2">
            <BrandLogo className="h-7 w-auto" sizes="120px" priority />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">
                {isLogin ? 'Acesso seguro' : 'Comece agora'}
              </p>
              <h1 className="mb-2 text-xl font-bold leading-snug tracking-tight text-slate-950 lg:text-[22px]">
                {isLogin ? 'Acesse o Avalia Solar' : 'Crie sua conta no Avalia Solar'}
              </h1>

              <p className="text-xs leading-relaxed text-slate-600">
                {isLogin
                  ? 'Gerencie sua presença, avaliações e oportunidades comerciais em um ambiente seguro.'
                  : 'Escolha o tipo de conta e centralize sua experiência na plataforma.'}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Benefits List */}
        <div className="border-t border-slate-200">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              className="divide-y divide-slate-200/80"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="grid grid-cols-[26px_1fr] gap-2.5 py-2.5 lg:py-3">
                  <span className="pt-0.5 text-xs font-bold text-blue-600">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-950">{benefit.title}</h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer / Trust Indicators */}
      <div className="relative z-10 mt-4 border-t border-slate-200 pt-3">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" aria-hidden="true" />
          <span>{isLogin ? 'Login seguro e criptografado' : 'Cadastro gratuito e seguro'}</span>
        </div>
      </div>
    </div>
  );
}
