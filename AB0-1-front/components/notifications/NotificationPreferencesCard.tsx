'use client';

import React, { useState, useEffect } from 'react';
import { Settings2, Check, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/store/notificationStore';

export const NotificationPreferencesCard: React.FC = () => {
  const { preferences, fetchPreferences, updatePreferences } = useNotificationStore();
  const [savedFeedback, setSavedFeedback] = useState(false);

  const [channels, setChannels] = useState({
    platform: true,
    email: true,
    push: true,
    whatsapp: false,
  });

  const [events, setEvents] = useState({
    quote_received: true,
    company_replied: true,
    review_published: true,
    new_message: true,
    favorite_company_updated: true,
  });

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleToggleChannel = (key: keyof typeof channels) => {
    setChannels((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveChanges(next, events);
      return next;
    });
  };

  const handleToggleEvent = (key: keyof typeof events) => {
    setEvents((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveChanges(channels, next);
      return next;
    });
  };

  const saveChanges = (ch: typeof channels, ev: typeof events) => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200 p-5 rounded-none shadow-sm space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Settings2 className="h-4 w-4 text-slate-600" />
          Preferências de alertas
        </h3>
        {savedFeedback && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 animate-fadeIn">
            Salvo
          </span>
        )}
      </div>

      {/* Channels */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-700">Receber notificações por:</h4>
        <div className="space-y-1.5 text-xs text-slate-700">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={channels.platform}
              onCheckedChange={() => handleToggleChannel('platform')}
              className="rounded-none border-slate-300 data-[state=checked]:bg-blue-600"
            />
            <span>Plataforma</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={channels.email}
              onCheckedChange={() => handleToggleChannel('email')}
              className="rounded-none border-slate-300 data-[state=checked]:bg-blue-600"
            />
            <span>E-mail</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={channels.push}
              onCheckedChange={() => handleToggleChannel('push')}
              className="rounded-none border-slate-300 data-[state=checked]:bg-blue-600"
            />
            <span>Push</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={channels.whatsapp}
              onCheckedChange={() => handleToggleChannel('whatsapp')}
              className="rounded-none border-slate-300 data-[state=checked]:bg-blue-600"
            />
            <span>WhatsApp (Opt-in LGPD)</span>
          </label>
        </div>
      </div>

      {/* Events */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700">Avisar quando:</h4>
        <div className="space-y-1.5 text-xs text-slate-700">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={events.quote_received}
              onCheckedChange={() => handleToggleEvent('quote_received')}
              className="rounded-none border-slate-300 data-[state=checked]:bg-blue-600"
            />
            <span>Receber um orçamento</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={events.company_replied}
              onCheckedChange={() => handleToggleEvent('company_replied')}
              className="rounded-none border-slate-300 data-[state=checked]:bg-blue-600"
            />
            <span>Uma empresa responder</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={events.review_published}
              onCheckedChange={() => handleToggleEvent('review_published')}
              className="rounded-none border-slate-300 data-[state=checked]:bg-blue-600"
            />
            <span>Minha avaliação for publicada</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={events.new_message}
              onCheckedChange={() => handleToggleEvent('new_message')}
              className="rounded-none border-slate-300 data-[state=checked]:bg-blue-600"
            />
            <span>Houver nova mensagem</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <Checkbox
              checked={events.favorite_company_updated}
              onCheckedChange={() => handleToggleEvent('favorite_company_updated')}
              className="rounded-none border-slate-300 data-[state=checked]:bg-blue-600"
            />
            <span>Uma empresa favorita atualizar o perfil</span>
          </label>
        </div>
      </div>

      <Button
        onClick={() => saveChanges(channels, events)}
        className="w-full h-8 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 rounded-none transition-colors"
      >
        Gerenciar preferências
      </Button>
    </div>
  );
};
