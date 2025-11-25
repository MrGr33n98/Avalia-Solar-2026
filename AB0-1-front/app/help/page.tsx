'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HelpPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Central de Ajuda</h1>
      
      <div className="max-w-3xl mx-auto mb-12">
        <p className="text-lg text-center mb-8">
          Encontre respostas para suas dúvidas mais frequentes sobre a Avalia Solar
          e o processo de avaliação de empresas do setor solar.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Para Consumidores</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li>
                <h3 className="font-semibold">Como avaliar uma empresa?</h3>
                <p className="text-sm">Aprenda a compartilhar sua experiência de forma efetiva.</p>
              </li>
              <li>
                <h3 className="font-semibold">Escolhendo uma empresa</h3>
                <p className="text-sm">Dicas para selecionar a melhor empresa para seu projeto solar.</p>
              </li>
              <li>
                <h3 className="font-semibold">Entendendo as avaliações</h3>
                <p className="text-sm">Como interpretar as avaliações e métricas da plataforma.</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Para Empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li>
                <h3 className="font-semibold">Cadastro de empresa</h3>
                <p className="text-sm">Como cadastrar e gerenciar seu perfil empresarial.</p>
              </li>
              <li>
                <h3 className="font-semibold">Respondendo avaliações</h3>
                <p className="text-sm">Melhores práticas para interagir com os clientes.</p>
              </li>
              <li>
                <h3 className="font-semibold">Métricas e relatórios</h3>
                <p className="text-sm">Como acessar e interpretar seus dados de desempenho.</p>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suporte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Email de Suporte</h3>
                <a href="mailto:suporte@avaliasolar.com.br" className="text-blue-600 hover:text-blue-800">
                  suporte@avaliasolar.com.br
                </a>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Horário de Atendimento</h3>
                <p className="text-sm">Segunda a Sexta: 9h às 18h</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Chat Online</h3>
                <p className="text-sm">Disponível durante o horário comercial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 bg-gray-50 p-8 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4 text-center">Não encontrou o que procurava?</h2>
        <p className="text-center text-lg mb-6">
          Entre em contato conosco que teremos prazer em ajudar.
        </p>
        <div className="flex justify-center">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Fale Conosco
          </button>
        </div>
      </div>
    </div>
  );
}