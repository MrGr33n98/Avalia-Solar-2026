'use client';

import { useState } from 'react';
import { getAnonymousId, handleUserIdentified } from '@/lib/analytics/identity-stitch';
import { sendIntentSignal } from '@/lib/analytics/hooks/useIntentTracking';

interface GatedContentFormProps {
  companyId: string;
  documentType: string;
  documentTitle: string;
  documentUrl: string;
  onSuccess?: () => void;
}

export function GatedContentDownload({
  companyId,
  documentType,
  documentTitle,
  documentUrl,
  onSuccess
}: GatedContentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const anonymousId = getAnonymousId();

      const response = await fetch('/api/v1/gated_downloads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_id: companyId,
          anonymous_id: anonymousId,
          document_type: documentType,
          document_title: documentTitle,
          document_url: documentUrl,
          contact_name: formData.name,
          contact_email: formData.email,
          contact_phone: formData.phone
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao processar download');
      }

      const data = await response.json();

      if (data.user_id) {
        await handleUserIdentified({
          id: data.user_id,
          email: formData.email,
          name: formData.name
        });
      }

      sendIntentSignal({
        company_id: companyId,
        user_id: data.user_id,
        anonymous_id: data.anonymous_id || anonymousId,
        signal_type: 'document_download',
        signal_category: 'research_intent',
        element_type: 'gated_content_download',
        metadata: {
          document_type: documentType,
          document_title: documentTitle
        }
      });

      window.open(documentUrl, '_blank', 'noopener,noreferrer');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar solicitação';
      setError(message);
      console.error('[GatedContent] Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border p-8 max-w-md mx-auto">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Baixe o Material
        </h3>
        <p className="text-gray-600">
          {documentTitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome Completo *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Corporativo *
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="seu@empresa.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone *
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(00) 00000-0000"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processando...' : 'Baixar Agora'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          Ao baixar, você concorda em receber comunicações relevantes.
        </p>
      </form>
    </div>
  );
}
