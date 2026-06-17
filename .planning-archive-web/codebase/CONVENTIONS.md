# Convenções e Estilo de Código - Avalia Solar

Este documento descreve os padrões de escrita de código, práticas recomendadas, nomenclaturas e regras de qualidade adotadas no ecossistema **Avalia Solar**.

---

## 💻 Convenções do Frontend Next.js (`AB0-1-front`)

### 1. Nomenclatura de Arquivos e Componentes
*   **Componentes React:** Devem usar PascalCase tanto no nome do arquivo quanto no componente exportado (ex: `BannerContainer.tsx`, `Sidebar.tsx`).
*   **Páginas e Roteamento:** Devem respeitar as regras do App Router do Next.js. Pastas em minúsculo e arquivos especiais sempre em minúsculo (ex: `page.tsx`, `layout.tsx`, `error.tsx`, `global-error.tsx`).
*   **Arquivos de Utilitários e Hooks:** Devem usar camelCase (ex: `useAuth.ts`, `formatCurrency.ts`).

### 2. Padrões de Código e TypeScript
*   **TypeScript Estrito:** A tipagem estrita é obrigatória. Evitar o uso do tipo genérico `any`. Se um tipo for indefinido inicialmente, usar uniões de tipos (`string | null`).
*   **Hooks do TanStack Query:** Centralizar chamadas de API em Hooks especializados na pasta `/hooks` para desacoplar a busca de dados da renderização dos componentes.
*   **Estilização com Tailwind CSS:**
    *   Sempre utilizar a ferramenta `cn(...)` (utilizando `clsx` e `tailwind-merge`) ao manipular strings de classes Tailwind dinâmicas para evitar conflitos de precedência nas classes CSS.
    *   Exemplo:
        ```typescript
        import { cn } from '@/lib/utils';

        export function Badge({ className, variant }) {
          return (
            <div className={cn("px-2 py-1 rounded", variant === 'premium' && "bg-amber-500", className)} />
          );
        }
        ```

### 3. Tratamento de Erros
*   **Error Boundaries do App Router:** Cada rota crítica deve conter um `error.tsx` local para capturar falhas locais daquela subárvore sem quebrar a aplicação inteira.
*   **Sentry:** Utilizar `Sentry.captureException(error)` explicitamente dentro de blocos `try/catch` de operações críticas (como processamento de formulários de leads, checkout de pagamentos).

---

## ⚙️ Convenções do Backend Rails (`AB0-1-back`)

### 1. Estilo Ruby on Rails (Ruby Style Guide)
*   **RuboCop:** Seguir as regras definidas no arquivo `.rubocop.yml`. Formatação automática com identação de 2 espaços.
*   **Nomenclaturas:**
    *   Classes e Módulos: PascalCase (ex: `CompaniesController`, `Leads::ProcessOtp`).
    *   Variáveis, Métodos e Atributos: snake_case (ex: `featured_banner`, `verify_otp!`).
    *   Símbolos: snake_case (ex: `:verification_failed`, `:succeeded`).

### 2. Boas Práticas do MVC
*   **Controllers Magros e Models Gordos (Skinny Controllers, Fat Models):** Lógica complexa de validação e modificação de dados deve morar no Model ou em um Service Object, nunca diretamente na Action do Controller.
*   **Strong Parameters:** Sempre filtrar os atributos aceitos na requisição usando `params.require(...).permit(...)` para blindar o banco de dados contra injeções de parâmetros.
*   **Serializers:** A formatação de payloads JSON para a API deve ser definida exclusivamente no Serializer correspondente (pasta `/serializers`), mantendo o Controller focado apenas em gerenciar o fluxo da requisição.

### 3. Tratamento de Erros no Backend
*   **Resgates Globais de API:** Erros comuns como `ActiveRecord::RecordNotFound` e `ActiveRecord::RecordInvalid` são tratados centralizadamente no `ApplicationController` para responder com códigos HTTP adequados (`404 Not Found` ou `422 Unprocessable Entity`) com mensagens JSON amigáveis.
*   **Transações:** Sempre utilizar `ActiveRecord::Base.transaction do ... end` quando persistir alterações que dependam de múltiplos registros simultâneos (ex: criar lead e registrar os matches das empresas de uma vez), garantindo atomicidade nas falhas.
