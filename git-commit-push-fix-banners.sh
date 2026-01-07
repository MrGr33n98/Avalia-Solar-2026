#!/bin/bash
# Script para commit e push das correções de banners

echo "=========================================="
echo "GIT COMMIT & PUSH - Fix Banners"
echo "=========================================="
echo ""

# 1. Verificar status
echo "1. Verificando status do repositório..."
git status
echo ""

# 2. Adicionar arquivos novos e modificados
echo "2. Adicionando arquivos ao staging..."
git add AB0-1-back/check_and_create_banners.rb
git add FIX_BANNERS_NAO_RENDERIZAM.md
git add verificar-banners.bat
echo "   ✓ Arquivos adicionados"
echo ""

# 3. Verificar o que será commitado
echo "3. Arquivos que serão commitados:"
git status --short
echo ""

# 4. Fazer commit
echo "4. Criando commit..."
git commit -m "fix: Adiciona diagnóstico e ferramentas para corrigir problema de renderização de banners

- Cria script check_and_create_banners.rb para verificar e diagnosticar banners
- Adiciona guia completo FIX_BANNERS_NAO_RENDERIZAM.md com soluções
- Cria verificar-banners.bat para execução rápida no Windows
- Identifica causa: API retorna array vazio porque não há banners com status approved
- Fornece múltiplas opções de solução: script, console Rails, admin panel

Problema: Frontend recebia Array(0) da API /banners?position=categories_top
Causa: Banners não atendem critérios do scope currently_active
Solução: Criar banners com active=true, moderation_status=approved e imagem anexada"
echo "   ✓ Commit criado"
echo ""

# 5. Push para o repositório remoto
echo "5. Enviando para o repositório remoto..."
echo "   Executando: git push origin main"
git push origin main
echo ""

echo "=========================================="
echo "✓ CONCLUÍDO!"
echo "=========================================="
echo ""
echo "Próximos passos:"
echo "1. Execute: verificar-banners.bat"
echo "2. Ou acesse: https://api.avaliasolar.com.br/admin/banners"
echo "3. Crie banners com position='categories_top'"
echo ""
