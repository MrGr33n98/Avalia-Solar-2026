'use client';

import { useState } from 'react';
import { Calendar, Clock, Eye, Mail, PhoneCall, Plus, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ActivityItem {
  id: number | string;
  activity_type: string;
  subject: string;
  body?: string | null;
  description?: string | null;
  occurred_at: string;
  actor_name?: string | null;
}

interface PersonActivitiesCardProps {
  activities: ActivityItem[];
  onScheduleActivity: () => void;
}

export default function PersonActivitiesCard({
  activities = [],
  onScheduleActivity,
}: PersonActivitiesCardProps) {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'logged'>('logged');

  const now = new Date();
  const scheduledActivities = activities.filter((a) => new Date(a.occurred_at) > now);
  const loggedActivities = activities.filter((a) => new Date(a.occurred_at) <= now);

  const currentList = activeTab === 'scheduled' ? scheduledActivities : loggedActivities;

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'call':
        return <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />;
      case 'meeting':
      case 'reunião':
        return <Calendar className="w-3.5 h-3.5 text-indigo-600" />;
      case 'inspection':
      case 'vistoria':
      case 'site_visit':
        return <Eye className="w-3.5 h-3.5 text-amber-600" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header with Tabs & Schedule */}
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Activities</h2>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('scheduled')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeTab === 'scheduled'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scheduled ({scheduledActivities.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logged')}
              className={`px-2.5 py-1 rounded-md transition ${
                activeTab === 'logged'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Logged ({loggedActivities.length})
            </button>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={onScheduleActivity}
          className="h-7 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 px-2"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Schedule activity
        </Button>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-slate-100">
        {currentList.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            {activeTab === 'scheduled'
              ? 'Nenhuma atividade ou reunião agendada no momento.'
              : 'Nenhuma atividade registrada anteriormente.'}
          </div>
        ) : (
          currentList.map((act) => {
            const formattedDate = new Date(act.occurred_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={act.id}
                className="p-3.5 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5">
                    {getActivityIcon(act.activity_type)}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{act.subject || 'Atividade Comercial'}</p>
                      <Badge className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0 capitalize border-slate-200">
                        {act.activity_type}
                      </Badge>
                    </div>

                    {(act.body || act.description) && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {act.body || act.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5 font-medium">
                      <span>{formattedDate}</span>
                      {act.actor_name && (
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          {act.actor_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
