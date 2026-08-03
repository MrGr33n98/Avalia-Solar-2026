#!/bin/bash
# =============================================================================
# AVALIA SOLAR 2026 - DIAGNÓSTICO SEO / AEO / GEO
# =============================================================================
# Uso: ./diagnostico-seo-aeo-geo.sh [URL_BASE]
# Exemplo: ./diagnostico-seo-aeo-geo.sh https://www.avaliasolar.com.br
# =============================================================================

set -e

URL_BASE="${1:-https://www.avaliasolar.com.br}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
REPORT_DIR="./relatorios-diagnostico"
REPORT_FILE="$REPORT_DIR/relatorio-$TIMESTAMP.md"
HTML_REPORT="$REPORT_DIR/relatorio-$TIMESTAMP.html"
TMP_DIR="/tmp/avalia-solar-diag-$TIMESTAMP"
mkdir -p "$REPORT_DIR" "$TMP_DIR"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERRO]${NC} $1"; }

# =============================================================================
# 0. VERIFICAÇÃO DO AMBIENTE DOCKER
# =============================================================================
check_docker() {
    log_info "Verificando containers Docker do projeto Avalia Solar..."
    echo "" >> "$REPORT_FILE"
    echo "## 0. Status dos Containers Docker" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    docker ps --filter "name=ab0" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> "$REPORT_FILE" 2>/dev/null || echo "Docker não disponível" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # Verifica saúde dos serviços principais
    for svc in ab0-frontend ab0-backend ab0-postgres ab0-redis; do
        status=$(docker inspect --format='{{.State.Status}}' "$svc" 2>/dev/null || echo "nao_encontrado")
        health=$(docker inspect --format='{{.State.Health.Status}}' "$svc" 2>/dev/null || echo "sem_healthcheck")
        if [ "$status" = "running" ]; then
            if [ "$health" = "healthy" ] || [ "$health" = "sem_healthcheck" ]; then
                log_ok "Container $svc: $status ($health)"
            else
                log_warn "Container $svc: $status (health=$health)"
            fi
        else
            log_error "Container $svc: $status"
        fi
    done
}

# =============================================================================
# 1. FETCH DE PÁGINAS PARA ANÁLISE
# =============================================================================
fetch_page() {
    local url="$1"
    local outfile="$2"
    curl -sL --max-time 15          -H "User-Agent: Mozilla/5.0 (compatible; AvaliaSolarBot/1.0; +https://www.avaliasolar.com.br/bot)"          "$url" > "$outfile" 2>/dev/null || echo "<!-- FETCH_ERROR -->" > "$outfile"
}

PAGES=(
    "/|homepage"
    "/blog|blog"
    "/companies|companies"
    "/help|help"
    "/categories/energia-solar-residencial|categoria-residencial"
    "/companies/energia-solar/go/goiania|local-goiania"
    "/dados-do-setor/cobertura-energia-solar-capitais|dados-setor"
)

fetch_all() {
    log_info "Baixando páginas para análise..."
    for page in "${PAGES[@]}"; do
        IFS='|' read -r path slug <<< "$page"
        fetch_page "$URL_BASE$path" "$TMP_DIR/$slug.html"
        log_ok "Baixado: $path → $slug.html"
    done

    # Robots.txt e Sitemap
    fetch_page "$URL_BASE/robots.txt" "$TMP_DIR/robots.txt"
    fetch_page "$URL_BASE/sitemap.xml" "$TMP_DIR/sitemap.xml"
}

# =============================================================================
# 2. DIAGNÓSTICO SEO
# =============================================================================
diagnose_seo() {
    log_info "Executando diagnóstico SEO..."
    echo "## 1. Diagnóstico SEO" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    for page in "${PAGES[@]}"; do
        IFS='|' read -r path slug <<< "$page"
        file="$TMP_DIR/$slug.html"

        echo "### Página: $path (\`$slug\`)" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"

        # Title
        title=$(grep -oP '(?<=<title>)[^<]+' "$file" 2>/dev/null | head -1 || echo "AUSENTE")
        title_len=${#title}
        if [ "$title" = "AUSENTE" ]; then
            echo "- ❌ **Title:** AUSENTE" >> "$REPORT_FILE"
        elif [ "$title_len" -lt 30 ]; then
            echo "- ⚠️ **Title:** "$title" (${title_len} chars - muito curto, ideal: 50-60)" >> "$REPORT_FILE"
        elif [ "$title_len" -gt 65 ]; then
            echo "- ⚠️ **Title:** "$title" (${title_len} chars - pode ser truncado no Google)" >> "$REPORT_FILE"
        else
            echo "- ✅ **Title:** "$title" (${title_len} chars)" >> "$REPORT_FILE"
        fi

        # Meta Description
        meta_desc=$(grep -oP '(?<=<meta[^>]*name=["\'''']description["\''''][^>]*content=["\''''])[^"\'''']+' "$file" 2>/dev/null | head -1 ||                     grep -oP '(?<=<meta[^>]*content=["\''''])[^"\'''']+(?=[^>]*name=["\'''']description["\''''])' "$file" 2>/dev/null | head -1 || echo "AUSENTE")
        meta_len=${#meta_desc}
        if [ "$meta_desc" = "AUSENTE" ]; then
            echo "- ❌ **Meta Description:** AUSENTE" >> "$REPORT_FILE"
        elif [ "$meta_len" -lt 120 ]; then
            echo "- ⚠️ **Meta Description:** "$meta_desc" (${meta_len} chars - muito curta, ideal: 150-160)" >> "$REPORT_FILE"
        elif [ "$meta_len" -gt 165 ]; then
            echo "- ⚠️ **Meta Description:** "$meta_desc" (${meta_len} chars - pode ser truncada)" >> "$REPORT_FILE"
        else
            echo "- ✅ **Meta Description:** "$meta_desc" (${meta_len} chars)" >> "$REPORT_FILE"
        fi

        # H1
        h1_count=$(grep -o '<h1' "$file" 2>/dev/null | wc -l)
        h1_text=$(grep -oP '(?<=<h1[^>]*>)[^<]+' "$file" 2>/dev/null | head -1 || echo "AUSENTE")
        if [ "$h1_count" -eq 0 ]; then
            echo "- ❌ **H1:** AUSENTE" >> "$REPORT_FILE"
        elif [ "$h1_count" -gt 1 ]; then
            echo "- ⚠️ **H1:** ${h1_count} encontrados (deve haver apenas 1 por página)" >> "$REPORT_FILE"
        else
            echo "- ✅ **H1:** "$h1_text"" >> "$REPORT_FILE"
        fi

        # Canonical
        canonical=$(grep -oP '(?<=<link[^>]*rel=["\'''']canonical["\''''][^>]*href=["\''''])[^"\'''']+' "$file" 2>/dev/null | head -1 || echo "AUSENTE")
        if [ "$canonical" = "AUSENTE" ]; then
            echo "- ❌ **Canonical:** AUSENTE" >> "$REPORT_FILE"
        else
            echo "- ✅ **Canonical:** $canonical" >> "$REPORT_FILE"
        fi

        # Open Graph
        og_title=$(grep -oP '(?<=<meta[^>]*property=["\'''']og:title["\''''][^>]*content=["\''''])[^"\'''']+' "$file" 2>/dev/null | head -1 || echo "AUSENTE")
        og_desc=$(grep -oP '(?<=<meta[^>]*property=["\'''']og:description["\''''][^>]*content=["\''''])[^"\'''']+' "$file" 2>/dev/null | head -1 || echo "AUSENTE")
        og_image=$(grep -oP '(?<=<meta[^>]*property=["\'''']og:image["\''''][^>]*content=["\''''])[^"\'''']+' "$file" 2>/dev/null | head -1 || echo "AUSENTE")
        if [ "$og_title" = "AUSENTE" ]; then echo "- ❌ **OG Title:** AUSENTE" >> "$REPORT_FILE"; else echo "- ✅ **OG Title:** Presente" >> "$REPORT_FILE"; fi
        if [ "$og_desc" = "AUSENTE" ]; then echo "- ❌ **OG Description:** AUSENTE" >> "$REPORT_FILE"; else echo "- ✅ **OG Description:** Presente" >> "$REPORT_FILE"; fi
        if [ "$og_image" = "AUSENTE" ]; then echo "- ❌ **OG Image:** AUSENTE" >> "$REPORT_FILE"; else echo "- ✅ **OG Image:** Presente" >> "$REPORT_FILE"; fi

        # Imagens sem alt
        img_no_alt=$(grep -o '<img[^>]*>' "$file" 2>/dev/null | grep -v 'alt=' | wc -l)
        img_total=$(grep -o '<img[^>]*>' "$file" 2>/dev/null | wc -l)
        if [ "$img_no_alt" -gt 0 ]; then
            echo "- ⚠️ **Imagens sem alt:** $img_no_alt de $img_total" >> "$REPORT_FILE"
        else
            echo "- ✅ **Imagens:** Todas com alt text ($img_total imagens)" >> "$REPORT_FILE"
        fi

        # Schema.org
        schema_count=$(grep -o 'application/ld+json' "$file" 2>/dev/null | wc -l)
        if [ "$schema_count" -eq 0 ]; then
            echo "- ❌ **Schema.org:** Nenhum JSON-LD encontrado" >> "$REPORT_FILE"
        else
            schema_types=$(grep -oP '"@type":\s*"\K([^"]*)' "$file" | sort -u | paste -sd ", " - || echo "Tipos não identificados")
            echo "- ✅ **Schema.org:** $schema_count bloco(s) encontrado(s). **Tipos:** $schema_types" >> "$REPORT_FILE"
        fi

        # Hreflang
        hreflang=$(grep -o 'hreflang=' "$file" 2>/dev/null | wc -l)
        if [ "$hreflang" -eq 0 ]; then
            echo "- ⚠️ **Hreflang:** Não encontrado (recomendado para pt-BR)" >> "$REPORT_FILE"
        else
            echo "- ✅ **Hreflang:** Presente" >> "$REPORT_FILE"
        fi

        # Viewport
        viewport=$(grep -o 'viewport' "$file" 2>/dev/null | wc -l)
        if [ "$viewport" -eq 0 ]; then
            echo "- ❌ **Viewport:** AUSENTE (crítico para mobile)" >> "$REPORT_FILE"
        else
            echo "- ✅ **Viewport:** Presente" >> "$REPORT_FILE"
        fi

        echo "" >> "$REPORT_FILE"
    done

    # Robots.txt
    echo "### robots.txt" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    if [ -s "$TMP_DIR/robots.txt" ] && [ "$(head -1 "$TMP_DIR/robots.txt")" != "<!-- FETCH_ERROR -->" ]; then
        echo "\`\`\`" >> "$REPORT_FILE"
        cat "$TMP_DIR/robots.txt" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"

        if grep -q "Sitemap" "$TMP_DIR/robots.txt" 2>/dev/null; then
            echo "- ✅ Sitemap referenciado no robots.txt" >> "$REPORT_FILE"
        else
            echo "- ❌ Sitemap NÃO referenciado no robots.txt" >> "$REPORT_FILE"
        fi
    else
        echo "- ❌ robots.txt não acessível ou vazio" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"

    # Sitemap
    echo "### sitemap.xml" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    if [ -s "$TMP_DIR/sitemap.xml" ] && [ "$(head -1 "$TMP_DIR/sitemap.xml")" != "<!-- FETCH_ERROR -->" ]; then
        sitemap_urls=$(grep -o '<loc>[^<]*</loc>' "$TMP_DIR/sitemap.xml" 2>/dev/null | wc -l)
        echo "- ✅ Sitemap acessível com $sitemap_urls URL(s)" >> "$REPORT_FILE"
        echo "\`\`\`xml" >> "$REPORT_FILE"
        head -30 "$TMP_DIR/sitemap.xml" >> "$REPORT_FILE"
        echo "\`\`\`" >> "$REPORT_FILE"
    else
        echo "- ❌ sitemap.xml não acessível ou vazio" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
}

# =============================================================================
# 3. DIAGNÓSTICO AEO (Answer Engine Optimization)
# =============================================================================
diagnose_aeo() {
    log_info "Executando diagnóstico AEO..."
    echo "## 2. Diagnóstico AEO" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    for page in "${PAGES[@]}"; do
        IFS='|' read -r path slug <<< "$page"
        file="$TMP_DIR/$slug.html"

        echo "### Página: $path" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"

        # FAQ Schema
        faq_schema=$(grep -o 'FAQPage' "$file" 2>/dev/null | wc -l)
        if [ "$faq_schema" -gt 0 ]; then
            echo "- ✅ **Schema FAQPage:** Encontrado" >> "$REPORT_FILE"
        else
            echo "- ❌ **Schema FAQPage:** Não encontrado" >> "$REPORT_FILE"
        fi

        # Resposta rápida / blocos de pergunta
        faq_blocks=$(grep -oiE '(pergunta frequente|faq|dúvida|resposta rápida|como escolher|quanto custa)' "$file" 2>/dev/null | wc -l)
        if [ "$faq_blocks" -gt 0 ]; then
            echo "- ✅ **Blocos de Pergunta/Resposta:** $faq_blocks ocorrência(s)" >> "$REPORT_FILE"
        else
            echo "- ⚠️ **Blocos de Pergunta/Resposta:** Nenhum encontrado" >> "$REPORT_FILE"
        fi

        # Listas numeradas (ótimo para featured snippets)
        ol_count=$(grep -o '<ol' "$file" 2>/dev/null | wc -l)
        li_count=$(grep -o '<li' "$file" 2>/dev/null | wc -l)
        echo "- ℹ️ **Listas ordenadas (ol):** $ol_count | **Itens de lista (li):** $li_count" >> "$REPORT_FILE"

        # Tabelas (ótimo para comparativos)
        table_count=$(grep -o '<table' "$file" 2>/dev/null | wc -l)
        echo "- ℹ️ **Tabelas:** $table_count" >> "$REPORT_FILE"

        # HowTo Schema
        howto=$(grep -o 'HowTo' "$file" 2>/dev/null | wc -l)
        if [ "$howto" -gt 0 ]; then
            echo "- ✅ **Schema HowTo:** Encontrado" >> "$REPORT_FILE"
        else
            echo "- ⚠️ **Schema HowTo:** Não encontrado (recomendado para guias passo a passo)" >> "$REPORT_FILE"
        fi

        # Speakable (para Google Assistente)
        speakable=$(grep -o 'Speakable' "$file" 2>/dev/null | wc -l)
        if [ "$speakable" -gt 0 ]; then
            echo "- ✅ **Schema Speakable:** Encontrado" >> "$REPORT_FILE"
        else
            echo "- ⚠️ **Schema Speakable:** Não encontrado (recomendado para voice search)" >> "$REPORT_FILE"
        fi

        echo "" >> "$REPORT_FILE"
    done
}

# =============================================================================
# 4. DIAGNÓSTICO GEO (Generative Engine Optimization)
# =============================================================================
diagnose_geo() {
    log_info "Executando diagnóstico GEO..."
    echo "## 3. Diagnóstico GEO" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    for page in "${PAGES[@]}"; do
        IFS='|' read -r path slug <<< "$page"
        file="$TMP_DIR/$slug.html"

        echo "### Página: $path" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"

        # Autor identificado
        author=$(grep -oiE '(author|autor|escrito por|por [A-Z][a-z]+ [A-Z][a-z]+)' "$file" 2>/dev/null | wc -l)
        if [ "$author" -gt 0 ]; then
            echo "- ✅ **Autoria identificada:** $author ocorrência(s)" >> "$REPORT_FILE"
        else
            echo "- ❌ **Autoria:** Não identificada (E-E-A-T crítico para GEO)" >> "$REPORT_FILE"
        fi

        # Data de publicação/atualização
        pubdate=$(grep -oiE '(published|datePublished|publicado em|atualizado em|modified)' "$file" 2>/dev/null | wc -l)
        if [ "$pubdate" -gt 0 ]; then
            echo "- ✅ **Datas de publicação:** $pubdate ocorrência(s)" >> "$REPORT_FILE"
        else
            echo "- ⚠️ **Datas:** Não encontradas (IAs preferem conteúdo datado)" >> "$REPORT_FILE"
        fi

        # Fontes / Referências
        references=$(grep -oiE '(fonte|referência|referencia|source|bibliografia|links úteis)' "$file" 2>/dev/null | wc -l)
        if [ "$references" -gt 0 ]; then
            echo "- ✅ **Referências/Sources:** $references ocorrência(s)" >> "$REPORT_FILE"
        else
            echo "- ⚠️ **Referências:** Não encontradas (IAs confiam em conteúdo com fontes)" >> "$REPORT_FILE"
        fi

        # Dados estatísticos/números (IAs amam dados concretos)
        numbers=$(grep -oE '[0-9]+([.,][0-9]+)?(%|kWh|MW|GW|R\$|reais|anos|meses|dias)' "$file" 2>/dev/null | wc -l)
        echo "- ℹ️ **Dados quantitativos:** $numbers ocorrência(s) (dados concretos = melhor para GEO)" >> "$REPORT_FILE"

        # Organization schema
        org_schema=$(grep -o 'Organization' "$file" 2>/dev/null | wc -l)
        if [ "$org_schema" -gt 0 ]; then
            echo "- ✅ **Schema Organization:** Encontrado" >> "$REPORT_FILE"
        else
            echo "- ⚠️ **Schema Organization:** Não encontrado" >> "$REPORT_FILE"
        fi

        # About / Mention schema
        about_schema=$(grep -oE '("@type"\s*:\s*"AboutPage"|"@type"\s*:\s*"Mention")' "$file" 2>/dev/null | wc -l)
        echo "- ℹ️ **Schema About/Mention:** $about_schema ocorrência(s)" >> "$REPORT_FILE"

        echo "" >> "$REPORT_FILE"
    done
}

# =============================================================================
# 5. DIAGNÓSTICO TÉCNICO (Performance & Segurança)
# =============================================================================
diagnose_tech() {
    log_info "Executando diagnóstico técnico..."
    echo "## 4. Diagnóstico Técnico" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # Headers HTTP
    echo "### Headers HTTP (Homepage)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    curl -sI --max-time 10 "$URL_BASE/" >> "$REPORT_FILE" 2>/dev/null || echo "Não foi possível obter headers" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # HTTPS
    if [[ "$URL_BASE" == https* ]]; then
        echo "- ✅ **HTTPS:** Ativo" >> "$REPORT_FILE"
    else
        echo "- ❌ **HTTPS:** Não detectado" >> "$REPORT_FILE"
    fi

    # HSTS
    hsts=$(curl -sI --max-time 10 "$URL_BASE/" 2>/dev/null | grep -i "strict-transport-security" || true)
    if [ -n "$hsts" ]; then
        echo "- ✅ **HSTS:** Presente" >> "$REPORT_FILE"
    else
        echo "- ⚠️ **HSTS:** Não detectado" >> "$REPORT_FILE"
    fi

    # X-Robots-Tag
    xrobots=$(curl -sI --max-time 10 "$URL_BASE/" 2>/dev/null | grep -i "x-robots-tag" || true)
    if [ -n "$xrobots" ]; then
        echo "- ℹ️ **X-Robots-Tag:** $xrobots" >> "$REPORT_FILE"
    else
        echo "- ✅ **X-Robots-Tag:** Não presente (páginas indexáveis)" >> "$REPORT_FILE"
    fi

    # Content-Type charset
    charset=$(curl -sI --max-time 10 "$URL_BASE/" 2>/dev/null | grep -i "content-type" | grep -i "charset" || true)
    if [ -n "$charset" ]; then
        echo "- ✅ **Charset declarado:** $charset" >> "$REPORT_FILE"
    else
        echo "- ⚠️ **Charset:** Não declarado no header" >> "$REPORT_FILE"
    fi

    echo "" >> "$REPORT_FILE"

    # Core Web Vitals simulado (via TTFB)
    echo "### Core Web Vitals (Simulação via curl)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    ttfb=$(curl -s -o /dev/null -w "%{time_starttransfer}" --max-time 15 "$URL_BASE/" 2>/dev/null || echo "0")
    ttfb_ms=$(echo "$ttfb * 1000" | bc 2>/dev/null | cut -d. -f1 || echo "N/A")

    if [ "$ttfb_ms" != "N/A" ] && [ "$ttfb_ms" -lt 600 ]; then
        echo "- ✅ **TTFB:** ${ttfb_ms}ms (Bom - abaixo de 600ms)" >> "$REPORT_FILE"
    elif [ "$ttfb_ms" != "N/A" ] && [ "$ttfb_ms" -lt 1000 ]; then
        echo "- ⚠️ **TTFB:** ${ttfb_ms}ms (Regular - entre 600ms e 1000ms)" >> "$REPORT_FILE"
    elif [ "$ttfb_ms" != "N/A" ]; then
        echo "- ❌ **TTFB:** ${ttfb_ms}ms (Ruim - acima de 1000ms)" >> "$REPORT_FILE"
    else
        echo "- ⚠️ **TTFB:** Não foi possível medir" >> "$REPORT_FILE"
    fi

    echo "" >> "$REPORT_FILE"
}

# =============================================================================
# 5.5 DIAGNÓSTICO DE LOGS (Googlebot)
# =============================================================================
diagnose_logs() {
    log_info "Verificando logs de acesso do servidor..."
    echo "## 4.5 Diagnóstico de Crawlers (Logs)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    NGINX_LOGS="/opt/nginx-proxy-manager/data/logs/*_access.log"
    if ls /opt/nginx-proxy-manager/data/logs/*_access.log 1> /dev/null 2>&1; then
        google_hits=$(grep -i "googlebot" /opt/nginx-proxy-manager/data/logs/*_access.log 2>/dev/null | wc -l || echo "0")
        echo "- ℹ️ **Hits do Googlebot nos logs:** $google_hits requisições recentes" >> "$REPORT_FILE"
    else
        echo "- ⚠️ **Logs do Nginx:** Não encontrados no padrão do Proxy Manager (/opt/...)" >> "$REPORT_FILE"
    fi
    echo "" >> "$REPORT_FILE"
}

# =============================================================================
# 6. SCORE E RECOMENDAÇÕES
# =============================================================================
generate_score() {
    log_info "Calculando scores e recomendações..."
    echo "## 5. Score e Recomendações Prioritárias" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    echo "| Dimensão | Score | Status |" >> "$REPORT_FILE"
    echo "|---|---|---|" >> "$REPORT_FILE"

    # Conta erros e acertos do SEO
    seo_ok=$(grep -c "✅" "$REPORT_FILE" 2>/dev/null || echo "0")
    seo_warn=$(grep -c "⚠️" "$REPORT_FILE" 2>/dev/null || echo "0")
    seo_err=$(grep -c "❌" "$REPORT_FILE" 2>/dev/null || echo "0")

    echo "| SEO Técnico | Calculado no relatório | Veja detalhes acima |" >> "$REPORT_FILE"
    echo "| AEO | Calculado no relatório | Veja detalhes acima |" >> "$REPORT_FILE"
    echo "| GEO | Calculado no relatório | Veja detalhes acima |" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    echo "### Recomendações Prioritárias (P0 → P3)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "| Prioridade | Ação | Páginas | Impacto |" >> "$REPORT_FILE"
    echo "|---|---|---|---|" >> "$REPORT_FILE"
    echo "| **P0** | Corrigir títulos e meta descriptions únicos | Todas | SEO |" >> "$REPORT_FILE"
    echo "| **P0** | Implementar Schema.org (LocalBusiness, FAQPage, AggregateRating) | Locais, Categorias, Perfis | SEO + AEO |" >> "$REPORT_FILE"
    echo "| **P1** | Criar seção FAQ na Homepage | / | AEO |" >> "$REPORT_FILE"
    echo "| **P1** | Adicionar autor e fontes nos artigos do Blog | /blog/* | GEO |" >> "$REPORT_FILE"
    echo "| **P1** | Expandir Resposta Rápida com dados locais | /companies/energia-solar/*/* | AEO + GEO |" >> "$REPORT_FILE"
    echo "| **P2** | Criar conteúdo original de dados do setor | /dados-do-setor/* | GEO |" >> "$REPORT_FILE"
    echo "| **P2** | Otimizar alt text de imagens | Todas | SEO |" >> "$REPORT_FILE"
    echo "| **P2** | Criar sitemap.xml e robots.txt otimizados | Todas | SEO |" >> "$REPORT_FILE"
    echo "| **P3** | Programa de link building (guest posts) | Off-site | GEO |" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
}

# =============================================================================
# 7. GERAR HTML
# =============================================================================
generate_html() {
    log_info "Gerando relatório HTML..."

    cat > "$HTML_REPORT" << 'HTMLEOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Relatório de Diagnóstico - Avalia Solar</title>
<style>
  :root { --bg:#0f172a; --card:#1e293b; --text:#e2e8f0; --accent:#38bdf8; --ok:#22c55e; --warn:#f59e0b; --err:#ef4444; }
  * { box-sizing:border-box; }
  body { font-family:'Segoe UI',system-ui,sans-serif; background:var(--bg); color:var(--text); margin:0; padding:2rem; line-height:1.6; }
  h1 { color:var(--accent); border-bottom:2px solid var(--accent); padding-bottom:.5rem; }
  h2 { color:var(--accent); margin-top:2rem; }
  h3 { color:#94a3b8; margin-top:1.5rem; }
  .card { background:var(--card); border-radius:12px; padding:1.5rem; margin:1rem 0; }
  pre { background:#0b1220; padding:1rem; border-radius:8px; overflow-x:auto; font-size:.85rem; }
  code { background:#0b1220; padding:.2rem .4rem; border-radius:4px; font-size:.9rem; }
  table { width:100%; border-collapse:collapse; margin:1rem 0; }
  th,td { border:1px solid #334155; padding:.6rem; text-align:left; }
  th { background:#1e293b; }
  .ok { color:var(--ok); }
  .warn { color:var(--warn); }
  .err { color:var(--err); }
  .badge { display:inline-block; padding:.2rem .6rem; border-radius:999px; font-size:.75rem; font-weight:600; }
  .badge-ok { background:rgba(34,197,94,.15); color:var(--ok); }
  .badge-warn { background:rgba(245,158,11,.15); color:var(--warn); }
  .badge-err { background:rgba(239,68,68,.15); color:var(--err); }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1rem; }
  footer { margin-top:3rem; text-align:center; color:#64748b; font-size:.85rem; }
</style>
</head>
<body>
<h1>🔍 Diagnóstico SEO / AEO / GEO</h1>
<p><strong>Plataforma:</strong> Avalia Solar &nbsp;|&nbsp; <strong>Data:</strong> TIMESTAMP_PLACEHOLDER &nbsp;|&nbsp; <strong>URL Base:</strong> URL_PLACEHOLDER</p>
HTMLEOF

    # Converter Markdown para HTML simples
    sed -e 's/^## /<h2>/g' \
        -e 's/^### /<h3>/g' \
        -e 's/^- ✅ /<li class="ok">✅ /g' \
        -e 's/^- ⚠️ /<li class="warn">⚠️ /g' \
        -e 's/^- ❌ /<li class="err">❌ /g' \
        -e 's/^- ℹ️ /<li>ℹ️ /g' \
        -e 's/\*\*\([^*]*\)\*\*/<strong>\1<\/strong>/g' \
        -e 's/`\([^`]*\)`/<code>\1<\/code>/g' \
        -e 's/^| /<tr><td>/g' \
        -e 's/ | /<\/td><td>/g' \
        -e 's/ |$/<\/td><\/tr>/g' \
        -e 's/^---$//g' "$REPORT_FILE" | \
    awk 'BEGIN{print "<div class=\"card\">"} /^<h2>/{if(in_list){print "</ul>";in_list=0} print "</div>\n<div class=\"card\">"} /^<h3>/{if(in_list){print "</ul>";in_list=0}} /^<li/{if(!in_list){print "<ul>";in_list=1}} {print} END{if(in_list)print "</ul>";print "</div>"}' >> "$HTML_REPORT"

    cat >> "$HTML_REPORT" << 'HTMLEOF'
<footer>
  <p>Relatório gerado automaticamente pelo script de diagnóstico Avalia Solar</p>
  <p>Para reexecutar: <code>./diagnostico-seo-aeo-geo.sh https://www.avaliasolar.com.br</code></p>
</footer>
</body>
</html>
HTMLEOF

    sed -i "s|TIMESTAMP_PLACEHOLDER|$TIMESTAMP|g" "$HTML_REPORT"
    sed -i "s|URL_PLACEHOLDER|$URL_BASE|g" "$HTML_REPORT"
}

# =============================================================================
# MAIN
# =============================================================================
main() {
    echo "============================================================================="
    echo "  AVALIA SOLAR 2026 - DIAGNÓSTICO SEO / AEO / GEO"
    echo "  URL Base: $URL_BASE"
    echo "  Timestamp: $TIMESTAMP"
    echo "============================================================================="
    echo ""

    echo "# Relatório de Diagnóstico SEO / AEO / GEO" > "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "**Plataforma:** Avalia Solar" >> "$REPORT_FILE"
    echo "**Data:** $TIMESTAMP" >> "$REPORT_FILE"
    echo "**URL Base:** $URL_BASE" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    check_docker
    fetch_all
    diagnose_seo
    diagnose_aeo
    diagnose_geo
    diagnose_tech
    diagnose_logs
    generate_score
    generate_html

    echo ""
    echo "============================================================================="
    log_ok "Diagnóstico concluído!"
    echo ""
    echo "  📄 Markdown: $REPORT_FILE"
    echo "  🌐 HTML:    $HTML_REPORT"
    echo ""
    echo "  Para visualizar o HTML no servidor:"
    echo "    python3 -m http.server 8080 --directory $REPORT_DIR"
    echo ""
    echo "============================================================================="
}

main "$@"
