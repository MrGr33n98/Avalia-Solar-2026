'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface RegisterSuccessProps {
  onReset: () => void;
}

export default function RegisterSuccess({ onReset }: RegisterSuccessProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center justify-center h-full text-center p-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        className="mb-6 rounded-full bg-green-100 p-6"
      >
        <CheckCircle className="h-16 w-16 text-emerald-600" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-slate-900 mb-2"
      >
        Cadastro enviado com sucesso!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-slate-600 mb-8 max-w-md"
      >
        Sua empresa foi cadastrada para análise e aprovação. Você receberá um e-mail de confirmação em breve.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex flex-col sm:flex-row gap-4 w-full max-w-sm"
      >
        <Button
          onClick={() => router.push('/')}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Voltar para Home
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          onClick={onReset}
          className="w-full"
        >
          Cadastrar outra empresa
          <RefreshCcw className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}
