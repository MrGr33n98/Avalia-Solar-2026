#!/usr/bin/env bash
# =============================================================================
# audit-images.sh — Avalia Solar Performance Audit
# Lista todos os assets públicos ordenados por tamanho com classificação P0/P1
# Uso: bash scripts/audit-images.sh [public_dir]
# =============================================================================

PUBLIC_DIR="${1:-./public}"

echo "============================================="
echo " Avalia Solar — Auditoria de Assets Públicos"
echo " Diretório: $PUBLIC_DIR"
echo " Data: $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================="
echo ""

if ! command -v find &>/dev/null; then
  echo "ERRO: 'find' não encontrado" >&2
  exit 1
fi

# Cabeçalho da tabela
printf "%-12s %-8s %-10s %s\n" "PRIORIDADE" "BYTES" "FORMATO" "CAMINHO"
printf "%-12s %-8s %-10s %s\n" "----------" "------" "--------" "-------"

# Conta por categoria
P0_COUNT=0
P1_COUNT=0
REVIEW_COUNT=0
OK_COUNT=0
TOTAL_BYTES=0

# Processa arquivos
while IFS= read -r file; do
  size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo 0)
  ext="${file##*.}"
  ext_upper=$(echo "$ext" | tr '[:lower:]' '[:upper:]')
  
  TOTAL_BYTES=$((TOTAL_BYTES + size))

  if [ "$size" -ge 2000000 ]; then
    priority="🔴 P0"
    P0_COUNT=$((P0_COUNT + 1))
  elif [ "$size" -ge 500000 ]; then
    priority="🟡 P1"
    P1_COUNT=$((P1_COUNT + 1))
  elif [ "$size" -ge 200000 ]; then
    priority="🔵 REVIEW"
    REVIEW_COUNT=$((REVIEW_COUNT + 1))
  else
    priority="✅ OK"
    OK_COUNT=$((OK_COUNT + 1))
  fi

  human_size=$(echo "$size" | awk '{
    if ($1 >= 1048576) printf "%.1fMB", $1/1048576
    else if ($1 >= 1024) printf "%.1fKB", $1/1024
    else printf "%dB", $1
  }')

  printf "%-14s %-10s %-12s %s\n" "$priority" "$human_size" "$ext_upper" "${file#$PUBLIC_DIR/}"
done < <(find "$PUBLIC_DIR" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" -o -iname "*.avif" -o -iname "*.gif" -o -iname "*.svg" \) -exec stat -c '%s %n' {} + 2>/dev/null | sort -rn | awk '{print $2}')

echo ""
echo "============================================="
echo " SUMÁRIO"
echo "============================================="
total_human=$(echo "$TOTAL_BYTES" | awk '{
  if ($1 >= 1048576) printf "%.1fMB", $1/1048576
  else if ($1 >= 1024) printf "%.1fKB", $1/1024
  else printf "%dB", $1
}')
echo " Total de assets: $((P0_COUNT + P1_COUNT + REVIEW_COUNT + OK_COUNT))"
echo " Tamanho total:   $total_human"
echo ""
echo " 🔴 P0 (> 2MB):    $P0_COUNT arquivo(s) — CRÍTICO: reduzir imediatamente"
echo " 🟡 P1 (> 500KB):  $P1_COUNT arquivo(s) — Otimizar em 1 sprint"
echo " 🔵 REVIEW (>200KB): $REVIEW_COUNT arquivo(s) — Avaliar oportunidade"
echo " ✅ OK (< 200KB):  $OK_COUNT arquivo(s)"
echo ""
echo " LEGENDA:"
echo " P0 = Bloqueia performance. Converter para WebP/AVIF ou redimensionar."
echo " P1 = Impacta. Otimizar com sharp, squoosh ou imagemin."
echo " REVIEW = Verificar se sizes/lazy estão corretos."
echo ""
echo " PRÓXIMOS PASSOS P0:"
echo " 1. Converter PNGs > 2MB para WebP/AVIF: npx sharp input.png -o output.webp"
echo " 2. Verificar se next/image está aplicado (evita servir original)"
echo " 3. Remover assets não referenciados"
echo "============================================="
