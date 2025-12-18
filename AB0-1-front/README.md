# 🌟 AB0-1 Frontend

> Sistema de Avaliação Solar - Interface moderna e responsiva construída com Next.js 14

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Monitoring-362d59?logo=sentry)](https://sentry.io/)

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Testes](#testes)
- [Deployment](#deployment)
- [Monitoramento](#monitoramento)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

---

## 🎯 Sobre o Projeto

O **AB0-1 Frontend** é a interface do usuário para o sistema de avaliação e comparação de empresas solares. Construído com Next.js 14 e App Router, oferece uma experiência moderna, rápida e acessível.

### ✨ Principais Funcionalidades

- 🏢 **Catálogo de Empresas**: Busca e filtro avançado de empresas solares
- 📍 **Filtro de Localização**: Filtro dinâmico por Estado e Cidade
- ⭐ **Sistema de Avaliações**: Visualização e criação de reviews
- 📊 **Dashboard**: Painel administrativo completo
- 🔐 **Autenticação**: Sistema seguro com JWT
- 🌓 **Dark Mode**: Suporte a temas claro/escuro
- 📱 **Responsivo**: Design mobile-first
- ♿ **Acessível**: Seguindo padrões WCAG 2.1
- 🚀 **Performance**: Otimizado para Core Web Vitals
- 🔍 **SEO**: Server-side rendering e metadados otimizados

---

## 🛠 Tecnologias

### Core
- **[Next.js 14.2.5](https://nextjs.org/)** - React framework com App Router
- **[React 18.2](https://reactjs.org/)** - Biblioteca JavaScript para interfaces
- **[TypeScript 5.2](https://www.typescriptlang.org/)** - Superset tipado do JavaScript
- **[Tailwind CSS 3.3](https://tailwindcss.com/)** - Framework CSS utility-first

### UI Components
- **[Radix UI](https://www.radix-ui.com/)** - Componentes acessíveis headless
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes reutilizáveis
- **[Lucide React](https://lucide.dev/)** - Ícones SVG
- **[Framer Motion](https://www.framer.com/motion/)** - Animações
- **[Recharts](https://recharts.org/)** - Gráficos e visualizações

### Form & Validation
- **[React Hook Form](https://react-hook-form.com/)** - Gerenciamento de formulários
- **[Zod](https://zod.dev/)** - Schema validation

### State & Data
- **[Axios](https://axios-http.com/)** - Cliente HTTP
- **[date-fns](https://date-fns.org/)** - Manipulação de datas

### Monitoring & Error Tracking
- **[Sentry](https://sentry.io/)** - Error tracking e performance monitoring

### Testing
- **[Jest](https://jestjs.io/)** - Framework de testes
- **[Testing Library](https://testing-library.com/)** - Testes de componentes React

### Development Tools
- **[ESLint](https://eslint.org/)** - Linter JavaScript/TypeScript
- **[PostCSS](https://postcss.org/)** - Processador CSS

---

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** >= 18.0.0 (recomendado: 20.x LTS)
- **npm** >= 9.0.0 ou **yarn** >= 1.22.0
- **Git** >= 2.30.0
- **Backend API** rodando (veja `../AB0-1-back/README.md`)

### Verificar versões instaladas

```bash
node --version  # v20.x.x
npm --version   # 9.x.x
git --version   # 2.x.x
```

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/AB0-1.git
cd AB0-1/AB0-1-front
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas configurações (veja [Configuração](#configuração)).

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Environment
NEXT_PUBLIC_ENV=development

# Sentry Configuration (opcional para desenvolvimento)
NEXT_PUBLIC_SENTRY_DSN=sua-dsn-do-sentry
SENTRY_ORG=sua-organizacao
SENTRY_PROJECT=seu-projeto
SENTRY_AUTH_TOKEN=seu-token

# Release tracking
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Configuração do Backend

Certifique-se de que o backend está rodando em `http://localhost:3001`. 
Veja instruções em `../AB0-1-back/README.md`.

---

## 💻 Uso

### Modo Desenvolvimento

Inicia o servidor de desenvolvimento com hot-reload:

```bash
npm run dev
# ou
yarn dev
```

Acesse: **http://localhost:3000**

### Build de Produção

```bash
# Criar build otimizado
npm run build

# Iniciar servidor de produção
npm start
```

### Linting

```bash
# Verificar problemas de código
npm run lint

# Corrigir problemas automaticamente
npm run lint -- --fix
```

---

## 📜 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Cria build de produção |
| `npm start` | Inicia servidor de produção |
| `npm run lint` | Executa ESLint |
| `npm test` | Executa testes com Jest |
| `npm run test:watch` | Executa testes em modo watch |
| `npm run test:coverage` | Gera relatório de cobertura |
| `npm run test:ci` | Executa testes no CI/CD |

---

## 📁 Estrutura de Pastas

```
AB0-1-front/
├── app/                      # App Router (Next.js 14)
│   ├── (auth)/              # Grupo de rotas de autenticação
│   │   ├── login/           # Página de login
│   │   └── register/        # Página de registro
│   ├── (marketing)/         # Grupo de rotas públicas
│   │   ├── about/           # Sobre nós
│   │   ├── blog/            # Blog
│   │   └── help/            # Ajuda
│   ├── admin/               # Painel administrativo
│   ├── companies/           # Catálogo de empresas
│   ├── categories/          # Categorias
│   ├── dashboard/           # Dashboard do usuário
│   ├── profile/             # Perfil do usuário
│   ├── reviews/             # Avaliações
│   ├── search/              # Busca avançada
│   ├── layout.tsx           # Layout raiz
│   ├── page.tsx             # Homepage
│   ├── error.tsx            # Error boundary
│   └── globals.css          # Estilos globais
│
├── components/              # Componentes React
│   ├── ui/                  # Componentes UI base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── admin/               # Componentes do admin
│   ├── ErrorBoundary.tsx    # Error boundary global
│   ├── Header.tsx           # Cabeçalho
│   ├── Footer.tsx           # Rodapé
│   ├── Navbar.tsx           # Navegação
│   └── ...
│
├── lib/                     # Utilitários e configurações
│   ├── api.ts              # Cliente API base
│   ├── api-client.ts       # Cliente API com interceptors
│   ├── api-analytics.ts    # API de analytics
│   ├── error-handler.ts    # Tratamento de erros
│   ├── utils.ts            # Funções utilitárias
│   └── index.ts            # Exports centralizados
│
├── hooks/                   # React Hooks customizados
│   ├── useAuth.ts          # Hook de autenticação
│   ├── useCompanies.ts     # Hook de empresas
│   ├── useCategories.ts    # Hook de categorias
│   ├── use-toast.ts        # Hook de notificações
│   ├── use-error-handler.ts # Hook de erros
│   └── ...
│
├── contexts/                # React Contexts
│   └── AuthContext.tsx     # Contexto de autenticação
│
├── types/                   # TypeScript type definitions
│   ├── company.ts
│   ├── review.ts
│   ├── user.ts
│   └── ...
│
├── utils/                   # Funções utilitárias
│
├── config/                  # Configurações
│   └── environments/       # Configs por ambiente
│
├── __tests__/              # Testes
│   ├── components/         # Testes de componentes
│   ├── pages/              # Testes de páginas
│   └── ...
│
├── public/                 # Arquivos estáticos
│   ├── images/
│   └── icons/
│
├── docs/                   # Documentação
│   ├── ERROR_BOUNDARIES.md
│   └── ...
│
├── .github/                # GitHub workflows
│   └── workflows/
│
├── next.config.js          # Configuração do Next.js
├── tailwind.config.ts      # Configuração do Tailwind
├── tsconfig.json           # Configuração do TypeScript
├── jest.config.js          # Configuração do Jest
├── .eslintrc.json          # Configuração do ESLint
├── postcss.config.js       # Configuração do PostCSS
├── components.json         # Configuração do shadcn/ui
├── package.json            # Dependências e scripts
└── README.md               # Este arquivo
```

---

## 🧪 Testes

### Executar Testes

```bash
# Executar todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Cobertura de Testes

Os testes cobrem:
- ✅ Componentes UI
- ✅ Hooks customizados
- ✅ Error boundaries
- ✅ Utilitários e helpers
- ✅ Integração com API

**Meta de Cobertura:** 80%+

### Estrutura de Testes

```typescript
// Exemplo de teste de componente
describe('CompanyCard', () => {
  it('should render company information correctly', () => {
    render(<CompanyCard company={mockCompany} />);
    expect(screen.getByText(mockCompany.name)).toBeInTheDocument();
  });
});
```

---

## 🚢 Deployment

### Build para Produção

```bash
# 1. Criar build otimizado
npm run build

# 2. Testar build localmente
npm start

# 3. Verificar em http://localhost:3000
```

### Docker

```bash
# Build da imagem
docker build -t ab01-frontend .

# Executar container
docker run -p 3000:3000 ab01-frontend
```

### Variáveis de Ambiente de Produção

```env
NEXT_PUBLIC_API_URL=https://api.avaliasolar.com.br/api/v1
NEXT_PUBLIC_API_BASE_URL=https://api.avaliasolar.com.br
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_SENTRY_DSN=sua-dsn-producao
```

### Plataformas Recomendadas

- **Vercel** (recomendado para Next.js)
- **Netlify**
- **AWS Amplify**
- **Google Cloud Run**
- **Docker + Nginx**

---

## 📊 Monitoramento

### Sentry

O projeto usa **Sentry** para monitoramento de erros e performance.

#### Configuração

1. Crie uma conta em [sentry.io](https://sentry.io/)
2. Crie um novo projeto Next.js
3. Configure as variáveis de ambiente:

```env
NEXT_PUBLIC_SENTRY_DSN=sua-dsn
SENTRY_ORG=sua-org
SENTRY_PROJECT=seu-projeto
SENTRY_AUTH_TOKEN=seu-token
```

#### Features Habilitadas

- ✅ Error tracking (client e server)
- ✅ Performance monitoring
- ✅ Session replay
- ✅ Source maps upload
- ✅ Release tracking
- ✅ User feedback

#### Visualizar Erros

Acesse: `https://sentry.io/organizations/[org]/issues/`

---

## 🏗️ Arquitetura

### App Router (Next.js 14)

O projeto utiliza o novo **App Router** do Next.js 14:

- ✅ **Server Components** por padrão
- ✅ **Streaming e Suspense**
- ✅ **Parallel Routes**
- ✅ **Intercepting Routes**
- ✅ **Route Groups**
- ✅ **Server Actions**

### Padrões de Projeto

- **Component Composition**: Componentes pequenos e reutilizáveis
- **Custom Hooks**: Lógica compartilhada encapsulada
- **Error Boundaries**: Tratamento robusto de erros
- **TypeScript Strict**: Type safety completo
- **API Client Pattern**: Cliente HTTP centralizado
- **Context + Hooks**: State management leve

### Performance

- ✅ Code splitting automático
- ✅ Image optimization (Next/Image)
- ✅ Font optimization (next/font)
- ✅ Route prefetching
- ✅ Static generation (SSG)
- ✅ Server-side rendering (SSR)
- ✅ Incremental Static Regeneration (ISR)

---

## 🎨 UI/UX

### Design System

Baseado em **shadcn/ui** + **Radix UI**:

- ✅ Componentes acessíveis (ARIA)
- ✅ Tema claro/escuro
- ✅ Animações suaves (Framer Motion)
- ✅ Design responsivo
- ✅ Mobile-first

### Tipografia

- **Font**: Inter (next/font)
- **Escalas**: Tailwind Typography

### Cores

```css
/* Tema Claro */
--primary: 262.1 83.3% 57.8%
--secondary: 220 14.3% 95.9%

/* Tema Escuro */
--primary: 263.4 70% 50.4%
--secondary: 215 27.9% 16.9%
```

---

## 🔐 Segurança

### Implementado

- ✅ HTTPS only (em produção)
- ✅ CSP (Content Security Policy)
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ XSS Protection
- ✅ JWT Authentication
- ✅ Input sanitization
- ✅ Rate limiting (via backend)

### Boas Práticas

- Nunca commitar secrets (`.env.local` no `.gitignore`)
- Usar variáveis de ambiente para configs sensíveis
- Validar inputs no client e server
- Escapar dados do usuário
- Atualizar dependências regularmente

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Veja nosso [Guia de Contribuição](../CONTRIBUTING.md).

### Como Contribuir

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Code Style

- Use **TypeScript** para novos arquivos
- Siga o **ESLint** config
- Escreva **testes** para novas features
- Documente mudanças significativas
- Use **Conventional Commits**

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](../LICENSE) para mais detalhes.

---

## 👥 Time

- **Frontend Lead**: [Seu Nome]
- **Backend Lead**: [Nome do Dev Backend]
- **DevOps**: [Nome do DevOps]
- **Design**: [Nome do Designer]

---

## 📞 Suporte

- **Email**: suporte@avaliasolar.com.br
- **Docs**: [docs.avaliasolar.com.br](https://docs.avaliasolar.com.br)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/AB0-1/issues)

---

## 🔗 Links Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Sentry Docs](https://docs.sentry.io/)

---

## 📝 Changelog

Veja [CHANGELOG.md](./CHANGELOG.md) para histórico de mudanças.

---

## 🙏 Agradecimentos

- [Next.js](https://nextjs.org/) pela incrível framework
- [Vercel](https://vercel.com/) por hospedar e manter o Next.js
- [shadcn](https://twitter.com/shadcn) pelos componentes UI
- [Radix UI](https://www.radix-ui.com/) pelos primitivos acessíveis
- Toda a comunidade open source! 🚀

---

**Feito com ❤️ pelo time AB0-1**
