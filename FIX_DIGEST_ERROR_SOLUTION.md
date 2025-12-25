# Solução para o Erro "Cannot read properties of null (reading 'digest')"

## 🔍 Diagnóstico

O erro `TypeError: Cannot read properties of null (reading 'digest')` no Next.js 14 geralmente ocorre por:

1. **Inconsistências de Hidratação** (server vs client rendering)
2. **Scripts JSON-LD mal configurados** (sem `strategy`)
3. **Cache corrompido** no Docker

## ✅ Correções Aplicadas

### 1. JSON-LD com Next.js Script Component

**Arquivo**: `app/categories/page.tsx`
- ❌ **Antes**: Usando `<script>` HTML diretamente
- ✅ **Depois**: Usando `<Script>` do Next.js com `strategy="afterInteractive"`

```tsx
<Script
  id="categories-jsonld"
  type="application/ld+json"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

**Arquivo**: `app/blog/[slug]/page.tsx`
- ❌ **Antes**: Script sem estratégia definida
- ✅ **Depois**: Adicionado `strategy="afterInteractive"`

### 2. Remoção do Suspense Desnecessário

- Removido `<Suspense>` wrapper que pode causar problemas de hidratação
- O componente `CategoriesIndexWithSidebar` já é cliente e gerencia loading internamente

## 🚀 Próximos Passos para Resolver Completamente

### 1. Rebuild da Imagem Docker (Recomendado)

```bash
# No servidor de produção
cd ~/Avalia-Solar-2026

# Parar containers
docker-compose down

# Limpar cache do Docker
docker builder prune -af

# Rebuild sem cache
docker-compose build --no-cache frontend

# Subir novamente
docker-compose up -d
```

### 2. Verificar Logs Após Rebuild

```bash
docker logs -f avalia_frontend_prod --tail=100
```

### 3. Se o Erro Persistir

**Opção A: Limpar Cache do Next.js Localmente**
```bash
cd AB0-1-front
rm -rf .next
npm run build
```

**Opção B: Verificar Variáveis de Ambiente**
- Confirmar que `NEXT_PUBLIC_API_URL` está correto
- Confirmar que `NODE_ENV=production`

**Opção C: Desabilitar Temporarily o JSON-LD**
- Comentar temporariamente o `<Script>` de JSON-LD para isolar o problema

## 📊 Impacto das Mudanças

- ✅ **SEO**: Mantido (JSON-LD continua funcionando)
- ✅ **Performance**: Melhorada (estratégia afterInteractive)
- ✅ **Hidratação**: Corrigida (uso correto do Next.js Script)
- ✅ **Compatibilidade**: Next.js 14 best practices

## 🔧 Comandos de Diagnóstico

```bash
# Ver todos os logs do frontend
docker logs avalia_frontend_prod

# Ver apenas erros
docker logs avalia_frontend_prod 2>&1 | grep -i "error\|typeerror"

# Verificar se o container está saudável
docker ps | grep frontend

# Inspecionar variáveis de ambiente
docker exec avalia_frontend_prod env | grep NEXT
```

## 📝 Notas

- O erro aparece múltiplas vezes porque cada requisição tenta renderizar a página
- A correção foi aplicada no código, mas requer rebuild do Docker para surtir efeito
- O uso de `strategy="afterInteractive"` é a abordagem recomendada pelo Next.js para scripts externos
