/**
 * Tracked Form Component
 * 
 * Exemplo de formulário com GTM tracking completo
 * Rastreia: início, envio, sucesso, erro
 */

'use client';

import { useState, FormEvent } from 'react';
import { 
  trackFormStart, 
  trackFormSubmit, 
  trackFormError,
  trackLeadGenerated 
} from '@/lib/dataLayer';

interface FormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

interface TrackedContactFormProps {
  formName?: string;
  formLocation?: string;
  onSuccess?: () => void;
}

export function TrackedContactForm({ 
  formName = 'contact_form',
  formLocation = window.location.pathname,
  onSuccess 
}: TrackedContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  
  const [formStarted, setFormStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Track form start quando usuário interage pela primeira vez
  const handleFirstFocus = () => {
    if (!formStarted) {
      trackFormStart(formName, formLocation);
      setFormStarted(true);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Track form submission
    trackFormSubmit(formName, {
      hasName: !!formData.name,
      hasEmail: !!formData.email,
      hasPhone: !!formData.phone,
      hasMessage: !!formData.message,
    });

    try {
      // Simular envio para API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Track lead generated - SUCESSO
      trackLeadGenerated(formName, 'qualified', {
        source: 'website',
        page: formLocation,
        formFields: Object.keys(formData).filter(key => formData[key as keyof FormData]),
      });

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setFormStarted(false);
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Form submission error:', error);
      
      // Track form error
      trackFormError(
        formName,
        'submit',
        error instanceof Error ? error.message : 'Unknown error'
      );

      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Nome Completo *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onFocus={handleFirstFocus}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Seu nome"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={handleFirstFocus}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="seu@email.com"
          />
        </div>

        {/* Telefone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Telefone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            onFocus={handleFirstFocus}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(11) 99999-9999"
          />
        </div>

        {/* Mensagem */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Mensagem *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            onFocus={handleFirstFocus}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Sua mensagem..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
        </button>

        {/* Success Message */}
        {submitStatus === 'success' && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            ✅ Mensagem enviada com sucesso! Entraremos em contato em breve.
          </div>
        )}

        {/* Error Message */}
        {submitStatus === 'error' && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            ❌ Erro ao enviar mensagem. Por favor, tente novamente.
          </div>
        )}
      </form>
    </div>
  );
}

export default TrackedContactForm;
