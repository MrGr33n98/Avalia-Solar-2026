'use client';

import React from 'react';
import { Trophy, Award, Star, CheckCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface AchievementsModalProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white rounded-none border border-slate-200 p-6 shadow-xl font-sans">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
          <DialogTitle className="text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Conquistas e Progresso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Level Box */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-none space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase">Nível Atual</span>
              <span className="text-sm font-extrabold text-blue-600">Nível 2 — Explorador Solar</span>
            </div>
            <Progress value={70} className="h-2 bg-slate-200 rounded-none [&>div]:bg-blue-600" />
            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">350</strong> / 500 pontos acumulados para o Nível 3.
            </p>
          </div>

          {/* Activities list */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Como ganhar mais pontos:
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-center justify-between p-2 bg-white border border-slate-100">
                <span className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-600" /> Publicar uma avaliação detalhada
                </span>
                <span className="font-bold text-emerald-600">+100 pts</span>
              </li>
              <li className="flex items-center justify-between p-2 bg-white border border-slate-100">
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-blue-600" /> Solicitar e comparar orçamentos
                </span>
                <span className="font-bold text-emerald-600">+50 pts</span>
              </li>
              <li className="flex items-center justify-between p-2 bg-white border border-slate-100">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" /> Completar 100% do seu perfil
                </span>
                <span className="font-bold text-emerald-600">+150 pts</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button
            onClick={onClose}
            className="rounded-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4"
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
