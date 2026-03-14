import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  Star,
  Award,
  Zap,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MetricCard from './MetricCard';

interface UniqueOverviewTabProps {
  companyId: string;
}

const motivationalMessages = [
  "Sua empresa está brilhando! 🚀",
  "Performance excepcional continua! 🌟",
  "Você está no topo do ranking! 🏆",
  "Crescimento impressionante! 📈",
  "Liderança consolidada! 👑"
];

export default function UniqueOverviewTab({ companyId }: UniqueOverviewTabProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentMessage((prev) => (prev + 1) % motivationalMessages.length);
        setIsVisible(true);
      }, 300);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const metrics = [
    {
      title: "Score Elite",
      value: "9.8",
      icon: Award,
      change: "+12%",
      changeType: 'positive' as const,
      trend: [20, 35, 45, 60, 75, 85, 95],
      color: 'brand-blue'
    },
    {
      title: "Posição no Ranking",
      value: "#3",
      icon: Target,
      change: "+2 posições",
      changeType: 'positive' as const,
      trend: [80, 75, 70, 65, 60, 55, 50],
      color: 'brand-green'
    },
    {
      title: "Confiança Técnica",
      value: "94%",
      icon: Zap,
      change: "+5%",
      changeType: 'positive' as const,
      trend: [60, 65, 70, 80, 85, 90, 94],
      color: 'brand-yellow'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Unique Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[3rem] clay-card p-12 bg-gradient-to-br from-brand-blue/10 via-brand-cyan/5 to-brand-purple/10 border-2 border-white/10"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-10 right-10 w-32 h-32 bg-brand-blue/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{ 
              rotate: -360,
              scale: [1.1, 1, 1.1]
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute bottom-10 left-10 w-24 h-24 bg-brand-purple/20 rounded-full blur-xl"
          />
        </div>

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center shadow-2xl shadow-brand-blue/30">
              <Star className="h-8 w-8 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-brand-blue via-brand-cyan to-brand-purple bg-clip-text text-transparent">
                Bem-vindo ao seu Comando Central
              </h1>
              <p className="text-lg text-muted-foreground/80 font-medium">
                Seu dashboard personalizado de performance e estratégia
              </p>
            </div>
          </motion.div>

          {/* Rotating Motivational Message */}
          <AnimatePresence mode="wait">
            {isVisible && (
              <motion.div
                key={currentMessage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center py-6"
              >
                <p className="text-2xl font-black text-brand-blue dark:text-brand-cyan">
                  {motivationalMessages[currentMessage]}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 + 0.5 }}
          >
            <MetricCard {...metric} delay={index * 0.1} />
          </motion.div>
        ))}
      </div>

      {/* Custom Achievement Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="clay-card p-8 bg-gradient-to-r from-emerald-500/10 to-brand-green/10 border-2 border-emerald-500/20"
      >
        <div className="flex items-center gap-6">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-brand-green flex items-center justify-center shadow-xl"
          >
            <Award className="h-8 w-8 text-white" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-2">
              🎯 Meta Mensal Alcançada!
            </h3>
            <p className="text-muted-foreground font-medium">
              Parabéns! Você superou sua meta de score em 15%. Continue assim!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}