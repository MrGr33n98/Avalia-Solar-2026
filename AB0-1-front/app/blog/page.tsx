'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BlogPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Blog Avalia Solar</h1>
      
      <div className="max-w-3xl mx-auto mb-12">
        <p className="text-lg text-center mb-8">
          Fique por dentro das últimas novidades do setor de energia solar,
          dicas para consumidores e histórias de sucesso.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Guia Completo de Energia Solar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">15 de Janeiro, 2024</p>
            <p>Tudo o que você precisa saber antes de investir em energia solar para sua casa ou empresa.</p>
            <a href="#" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">Ler mais →</a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Economia com Energia Solar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">10 de Janeiro, 2024</p>
            <p>Descubra quanto você pode economizar ao migrar para energia solar fotovoltaica.</p>
            <a href="#" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">Ler mais →</a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manutenção de Painéis Solares</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-2">5 de Janeiro, 2024</p>
            <p>Dicas essenciais para manter seu sistema solar funcionando com eficiência máxima.</p>
            <a href="#" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">Ler mais →</a>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <p className="text-lg">
          Quer receber nossas atualizações? Inscreva-se em nossa newsletter:
        </p>
        <div className="max-w-md mx-auto mt-4">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Seu e-mail"
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Inscrever
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}