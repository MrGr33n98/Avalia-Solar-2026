# Blueprint: Full-Stack Rails + Next.js (AB0-1 Stack)

Este blueprint foi gerado a partir do projeto `AB0-1` e contém uma arquitetura testada e em produção, pronta para ser escalada para novos projetos ou negócios (como e-commerces, SaaS, Marketplaces, etc.).

## 🛠️ Stack Tecnológica

### Back-end (Ruby on Rails)
- **Framework:** Ruby on Rails 7.0.8
- **Banco de Dados:** PostgreSQL (Relacional) e Redis (Cache e Filas)
- **Background Jobs:** Sidekiq
- **Autenticação:** Devise (Configurado para JWT/API ou Session-based)
- **Painel Administrativo:** ActiveAdmin (Gestão de usuários, produtos, configurações)
- **Storage:** ActiveStorage (com suporte configurável para AWS S3 ou Local)

### Front-end (Next.js)
- **Framework:** Next.js 14+ (App Router ou Pages Router configurado base)
- **Linguagem:** TypeScript e React 18
- **Estilização:** TailwindCSS
- **Componentes de UI:** baseados no ecossistema (ShadCN UI, Radix, Lucide)
- **Analytics e Tracking:** PostHog integrado
- **SEO:** Meta tags base, suporte a Sitemap e Robots.txt estruturados

### Infraestrutura
- **Contêineres:** Docker e Docker Compose (Ambientes separados: dev, test, prod)
- **Servidor Web:** Nginx (via container ou proxy reverso de deploy)
- **Scripts:** Automação de setup e deploy (`Makefile`, scripts `.sh`)

---

## 📁 Estrutura do Blueprint

O Blueprint gerado contém:
```
{{PROJECT_NAME_KEBAB}}/
├── back-end/               # API Rails, ActiveAdmin, Workers
├── front-end/              # Aplicação Next.js, Componentes Tailwind
├── infrastructure/         # Docker Compose, Configurações Nginx/Server
├── replicate.sh            # Script para instanciar novos projetos
└── README.md               # Esta documentação
```

---

## 🚀 Como Criar um Novo Projeto a partir deste Blueprint

Para criar um novo projeto rapidamente (ex: `meu-novo-saas`):

1. **Acesse a pasta onde o blueprint foi gerado** (geralmente `~/blueprints/nome-do-blueprint`).
2. **Execute o script de replicação:**

```bash
./replicate.sh meu-novo-saas
```

3. **Vá para a pasta do novo projeto:**
```bash
cd ~/novos-projetos/meu-novo-saas
```

O script cuidará de buscar e substituir as chaves globais (`{{PROJECT_NAME_KEBAB}}`, `{{PROJECT_NAME_SNAKE}}`, etc.) pelo nome do seu novo projeto em todos os arquivos de configuração (ex: `database.yml`, `package.json`, nomes de classes no backend, etc).

---

## 🔧 Configuração e Setup Local (Pós-Replicação)

### 1. Back-end (Rails)
```bash
cd meu-novo-saas-back
bundle install
cp .env.development.example .env.development
rails db:create db:migrate db:seed
rails s -p 3000
# Num terminal separado, inicie o Sidekiq (se aplicável):
bundle exec sidekiq
```

### 2. Front-end (Next.js)
```bash
cd meu-novo-saas-front
npm install
cp .env.example .env.local
npm run dev
```

### 3. Usando Docker Compose
```bash
cd infrastructure
docker-compose up --build
```

---

## 📐 Decisões Arquiteturais e Por Quê

1. **Separação de Contextos (Decoupled Front/Back):** O front-end em Next.js e o back-end em Rails permitem que times trabalhem de forma independente, além de facilitar a escalabilidade de cada ponta individualmente.
2. **ActiveAdmin para o Backoffice:** A agilidade no CRUD é vital para novos projetos. ActiveAdmin gera interfaces de gestão em minutos sem a necessidade de desenhar telas complexas no front-end para os administradores.
3. **Tailwind + Next.js:** Foco na alta performance (Server-Side Rendering/Static Site Generation) com estilos altamente reutilizáveis e fáceis de manter.
4. **Redis + Sidekiq:** Para garantir que e-mails, processos longos (importações, integrações com N8N) e CRON jobs não travem a thread principal da API.

---

## 🚀 Guia de Deploy em Produção

### 1. Back-end
- Recomenda-se plataformas como **Heroku**, **Render** ou deploy em VPS via Docker.
- Defina as variáveis de ambiente base: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY_BASE`.
- Garanta que o comando `rails db:migrate` rode em cada release.

### 2. Front-end
- O jeito mais fluido e otimizado é através da **Vercel**.
- Conecte o repositório na Vercel e adicione as `NEXT_PUBLIC_API_URL` apontando para o seu Back-end em produção.

---

## 🐞 Troubleshooting Comum

1. **Erro de CORS no Front-end:**
   Verifique o arquivo `config/initializers/cors.rb` no Rails. Certifique-se de que a URL do Front-end (ex: `http://localhost:3001` ou sua URL de produção) está permitida na lista de origens.

2. **Banco de Dados não conecta:**
   Verifique no `database.yml` ou no arquivo `.env` se as credenciais (usuário, senha e host) do PostgreSQL estão corretas e se o serviço está rodando.

3. **Jobs enfileirados mas não processados:**
   Geralmente significa que o `Sidekiq` não está rodando. Verifique se o container do Redis está de pé e inicie o Sidekiq.

---

> Esse blueprint tem como foco garantir a velocidade. O setup que tomava 3-5 dias de configuração de arquitetura base, CI/CD, roles e setups de views agora é feito em minutos.
