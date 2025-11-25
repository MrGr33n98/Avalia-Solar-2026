'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PressPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Sala de Imprensa</h1>
      
      <div className="max-w-3xl mx-auto mb-12">
        <p className="text-lg text-center mb-8">
          Bem-vindo à sala de imprensa da Avalia Solar. Aqui você encontra as últimas notícias,
          recursos de mídia e informações para jornalistas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Últimas Notícias</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li>
                <p className="font-semibold">Avalia Solar alcança marca de 1000 empresas cadastradas</p>
                <p className="text-sm text-gray-600">15 de Janeiro, 2024</p>
              </li>
              <li>
                <p className="font-semibold">Lançamento do novo sistema de avaliações</p>
                <p className="text-sm text-gray-600">1 de Janeiro, 2024</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kit de Imprensa</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>📊 Dados e estatísticas</li>
              <li>🖼️ Logotipos e recursos visuais</li>
              <li>📱 Screenshots da plataforma</li>
              <li>📄 Press releases</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato para Imprensa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Para solicitações de mídia e entrevistas, entre em contato:</p>
            <p className="font-semibold">Email:</p>
            <a href="mailto:imprensa@avaliasolar.com.br" className="text-blue-600 hover:text-blue-800">
              imprensa@avaliasolar.com.br
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gray-50 p-8 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Sobre a Avalia Solar</h2>
        <p className="text-lg leading-relaxed">
          A Avalia Solar é a principal plataforma de avaliação de empresas do setor de energia solar no Brasil.
          Nossa missão é promover transparência e confiabilidade no mercado de energia solar,
          conectando consumidores a empresas qualificadas através de avaliações autênticas e verificadas.
        </p>
      </div>
    </div>
  );
}