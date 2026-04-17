#!/usr/bin/env bash
# Remotion Rendering Commands - Avalia Solar
# ==================================================
# Quick reference for rendering videos
# Run from: C:\Users\Bobi\Desktop\AB0-1-main\videos

# Setup
echo "📦 Installing dependencies..."
npm install

# Development
echo "🎬 Starting Remotion Studio..."
npm run dev

# Production Rendering

echo "🎥 Renderizando RESIDENCIAL LEADS (31s)..."
npm run render:residencial

echo "🎥 Renderizando B2B EMPRESAS (58s)..."
npm run render:empresas

echo "🎥 Renderizando REVIEWS GENERATION (32s)..."
npm run render:reviews

echo "🎥 Renderizando CATEGORIAS DISCOVERY (50s)..."
npm run render:categorias

# Alternative: Render all at once
echo "🎥 Renderizando TODOS os vídeos..."
npm run render:all

# Advanced options
# High quality + H.265 (menor arquivo, melhor qualidade)
echo "⚡ Renderizando com qualidade máxima (H.265)..."
remotion render src/Root.tsx ResidencialLeads \
  --output=out/residencial-leads-hq.mp4 \
  --quality 100 \
  --codec h265

# Fast rendering with concurrency
echo "⚡ Renderizando com paralelização (mais rápido)..."
remotion render src/Root.tsx B2BEmpresas \
  --output=out/b2b-empresas-fast.mp4 \
  --concurrency 4

echo "✅ Renderização completa! Vídeos em: videos/out/"
