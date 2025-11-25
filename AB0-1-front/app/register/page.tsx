'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { formatPhone, isValidPhone, formatCNPJ, isValidCNPJ } from '@/app/dashboard/utils';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emailPublic, setEmailPublic] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!name || name.trim().length < 3) {
      setError('Informe o nome da empresa');
      return;
    }
    if (!description || description.trim().length < 10) {
      setError('Informe uma descrição com pelo menos 10 caracteres');
      return;
    }
    if (!emailPublic.includes('@')) {
      setError('Informe um e-mail válido');
      return;
    }
    const formattedPhone = formatPhone(phone);
    if (!isValidPhone(formattedPhone)) {
      setError('Informe um telefone válido no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX');
      return;
    }
    const formattedCnpj = cnpj ? formatCNPJ(cnpj) : '';
    const cleanedCnpj = formattedCnpj.replace(/\D/g, '');
    if (cnpj && cleanedCnpj.length !== 14) {
      setError('Informe um CNPJ com 14 dígitos');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      await fetchApi('/companies', {
        method: 'POST',
        body: JSON.stringify({
          company: {
            name,
            description,
            email_public: emailPublic,
            phone: formattedPhone,
            address,
            state,
            city,
            cnpj: formattedCnpj,
            status: 'pending'
          }
        })
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Cadastro de Empresa</CardTitle>
          <CardDescription className="text-center">
            Cadastre sua empresa para análise e aprovação pelo time administrativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {submitted ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 text-green-700 rounded-md text-sm">
                Cadastro enviado com sucesso. Sua empresa está com status "pendente" e será analisada pelo Active Admin. Você receberá uma notificação quando for aprovada.
              </div>
              <Button className="w-full" onClick={() => router.push('/companies')}>Ir para Empresas</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Empresa *</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Input id="description" type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email_public">E-mail Público *</Label>
                <Input id="email_public" type="email" value={emailPublic} onChange={(e) => setEmailPublic(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input id="state" type="text" value={state} onChange={(e) => setState(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="mt-1" />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Cadastrar Empresa'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4" />
      </Card>
    </div>
  );
}
