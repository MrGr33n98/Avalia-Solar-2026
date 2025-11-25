# Company Dashboard - Sistema de Gestão para Empresas

## 📋 Visão Geral

Dashboard completo de gestão para empresas cadastradas na plataforma, com sistema de aprovação via ActiveAdmin para todas as alterações.

## 🎯 Funcionalidades

### 1. **Informações da Empresa** (`CompanyInfo.tsx`)
- ✅ Edição completa de dados cadastrais
- ✅ Upload de logo e banner
- ✅ Informações de contato (telefone, email, WhatsApp)
- ✅ Endereço e geolocalização
- ✅ Redes sociais
- ✅ Horários de funcionamento
- ✅ Métodos de pagamento
- ✅ Certificações e prêmios

### 2. **Categorias** (`CategoriesManagement.tsx`)
- ✅ Seleção de categorias de atuação
- ✅ Categorias em destaque (featured)
- ✅ Status de aprovação por categoria
- ✅ Adicionar/remover categorias (com aprovação)

### 3. **Banners & Patrocínios** (`BannersSponsorship.tsx`)
- ✅ Contratação de banners por categoria
- ✅ Escolha de posição (top, sidebar, etc)
- ✅ Gestão de planos patrocinados
- ✅ Status e histórico de campanhas
- ✅ Métricas de performance

### 4. **Produtos** (`ProductsManagement.tsx`)
- ✅ Listagem de produtos/serviços
- ✅ Adicionar/editar produtos
- ✅ Gestão de preços e planos
- ✅ Controle de estoque
- ✅ Status de publicação

### 5. **Reviews** (`ReviewsManagement.tsx`)
- ✅ Visualização de todas as avaliações
- ✅ Destacar reviews (featured/pin)
- ✅ Contestar avaliações
- ✅ Verificação de reviews
- ✅ Estatísticas de avaliações

### 6. **Galeria de Mídia** (`MediaGallery.tsx`)
- ✅ Upload de fotos
- ✅ Gestão de imagens
- ✅ Preview e edição
- ✅ Organização por projetos

### 7. **Leads & Oportunidades** (`LeadsOpportunities.tsx`)
- ✅ Visualização de leads recebidos
- ✅ Informações de contato
- ✅ Status de atendimento
- ✅ Estatísticas de conversão
- ✅ Ações rápidas (ligar, email, WhatsApp)

### 8. **Campanhas** (`CampaignsMarketing.tsx`)
- ✅ Criação de campanhas de marketing
- ✅ Acompanhamento de metas
- ✅ Controle de orçamento
- ✅ Métricas de performance
- ✅ Relatórios

### 9. **Configurações** (`CompanySettings.tsx`)
- ✅ CTAs personalizados
- ✅ Templates de WhatsApp
- ✅ Configuração de UTMs
- ✅ Preferências gerais

## 🔐 Fluxo de Aprovação

### Sistema de Pending Changes

Todas as alterações feitas no dashboard passam por um sistema de aprovação:

1. **Usuário faz alteração** → Salva como `pending_change`
2. **Admin recebe notificação** → Revisa no ActiveAdmin
3. **Admin aprova/rejeita** → Sistema aplica ou descarta
4. **Usuário é notificado** → Recebe feedback da ação

### Modelo `PendingChange`

```ruby
class PendingChange < ApplicationRecord
  belongs_to :company
  belongs_to :user
  belongs_to :approved_by, class_name: 'AdminUser'
  
  # Tipos de mudanças
  CHANGE_TYPES = %w[
    company_info
    categories
    banner
    product
    media
    cta_config
  ]
  
  # Status: pending, approved, rejected
end
```

## 🚀 Como Usar

### Frontend (Next.js)

```typescript
// Acessar o dashboard
import CompanyDashboard from '@/app/dashboard/company-dashboard';

<CompanyDashboard companyId="123" />
```

### Backend (Rails API)

```ruby
# Rotas disponíveis
namespace :api do
  namespace :v1 do
    resources :company_dashboard, only: [] do
      collection do
        get :stats
        get :notifications
        get :pending_changes
        post :update_info
        post :add_categories
        post :remove_category
        post :update_ctas
      end
    end
  end
end
```

## 📊 Métricas e Analytics

O dashboard exibe métricas em tempo real:

- **Visualizações de perfil**
- **Cliques em CTAs**
- **Cliques em WhatsApp**
- **Leads recebidos**
- **Reviews e rating médio**
- **Taxa de conversão**
- **Aprovações pendentes**

## 🎨 Design System

Utiliza **shadcn/ui** + **Tailwind CSS**:

- Cards interativos
- Animações com Framer Motion
- Tema responsivo e moderno
- Ícones do Lucide React
- Componentes reutilizáveis

## 🔧 Configuração

### 1. Executar Migration

```bash
cd AB0-1-back
rails db:migrate
```

### 2. Adicionar Rotas

```ruby
# config/routes.rb
namespace :api do
  namespace :v1 do
    resource :company_dashboard, only: [] do
      collection do
        get :stats
        get :notifications
        get :pending_changes
        post :update_info
        post :add_categories
        post :remove_category
        post :update_ctas
      end
    end
  end
end
```

### 3. Configurar Permissões

```ruby
# app/models/company.rb
has_many :pending_changes, dependent: :destroy

# app/models/user.rb
belongs_to :company, optional: true
```

## 📱 Responsividade

O dashboard é totalmente responsivo:

- **Mobile**: Layout em coluna única
- **Tablet**: Grid de 2 colunas
- **Desktop**: Grid de 4 colunas
- **Navegação**: Tabs adaptativas

## 🔔 Notificações

Sistema de notificações em tempo real:

- ✅ Alterações aprovadas/rejeitadas
- ✅ Novas avaliações
- ✅ Novos leads
- ✅ Campanhas encerradas
- ✅ Alertas importantes

## 🛡️ Segurança

- Autenticação obrigatória
- Multi-tenant (cada empresa vê apenas seus dados)
- Todas as alterações são auditadas
- Logs de ações administrativas

## 📈 Próximas Features

- [ ] Relatórios em PDF
- [ ] Integração com WhatsApp Business API
- [ ] Chat ao vivo com leads
- [ ] Dashboard mobile (PWA)
- [ ] Agendamento de posts
- [ ] Análise de concorrentes

## 🤝 Contribuindo

Este dashboard foi criado seguindo as melhores práticas:

- Clean Code
- TypeScript strict mode
- Componentização
- Testes unitários (em breve)

## 📞 Suporte

Para dúvidas ou sugestões sobre o dashboard:
- Email: suporte@plataforma.com
- Documentação: /docs/company-dashboard

---

**Desenvolvido com ❤️ para empoderar empresas na plataforma AB0-1**
