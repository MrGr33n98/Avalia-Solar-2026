'use client';

/* eslint-disable react/jsx-no-bind */
import { ChangeEvent, FormEvent, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SiteSurveyForm({ projectId }: { projectId: number }) {
  const [status, setStatus] = useState('draft');
  const [roofArea, setRoofArea] = useState('');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleStatusChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setStatus(event.target.value);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
    const response = await fetch(`/api/v1/sales/solar_projects/${projectId}/site_surveys`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_survey: { status, roof_area_m2: roofArea || null, observations } }),
    });
    setMessage(response.ok ? 'Vistoria salva.' : 'Não foi possível salvar a vistoria.');
    } catch {
      setMessage("Não foi possível conectar à API.");
    } finally {
      setSaving(false);
    }
  }

    {/* eslint-disable-next-line react/jsx-no-bind */}
  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-900">Vistoria técnica solar</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="survey-status">Status</Label>
          <select id="survey-status" value={status} onChange={handleStatusChange} className="h-9 w-full rounded-md border border-slate-300 px-2 text-sm">
            <option value="draft">Rascunho</option>
            <option value="scheduled">Agendada</option>
            <option value="completed">Concluída</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="roof-area">Área do telhado (m²)</Label>
          <Input id="roof-area" type="number" min="0" step="0.01" value={roofArea} onChange={(e) => setRoofArea(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="survey-observations">Observações</Label>
        <textarea id="survey-observations" value={observations} onChange={(e) => setObservations(e.target.value)} className="min-h-20 w-full rounded-md border border-slate-300 p-2 text-sm" />
      </div>
      <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar vistoria'}</Button>
      {message && <p role="status" className="text-xs text-slate-600">{message}</p>}
    </form>
  );
}
