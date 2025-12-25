# ✅ FIX APLICADO: swcMinify: false

## O QUE FOI FEITO

Adicionei `swcMinify: false` no arquivo `AB0-1-front/next.config.js` (linha 6).

Isso desabilita o compilador SWC que estava causando o erro de digest no Linux.

## 🚀 PRÓXIMO PASSO

Faça commit e push:

```bash
git add AB0-1-front/next.config.js
git commit -m "fix: Desabilitar swcMinify para corrigir erro de digest"
git push origin main
```

**O GitHub Actions vai fazer o deploy automaticamente em ~7 minutos.**

## ⚡ OU: Aplicar Manualmente no Servidor AGORA

Se não quiser esperar o workflow:

```bash
ssh root@ubuntu-s-1vcpu-2gb-70gb-intel-nyc3-01

cd ~/Avalia-Solar-2026

# Atualizar código
git pull origin main

# Rebuild sem cache
docker-compose build --no-cache frontend

# Restart
docker-compose up -d --force-recreate frontend

# Aguardar 15 segundos
sleep 15

# Verificar logs
docker logs --tail 30 avalia_frontend_prod
```

## ✅ RESULTADO ESPERADO

```
✓ Ready in 3.5s
○ Compiling /categories ...
✓ Compiled /categories in 1.2s
```

**SEM mensagens de erro de digest!**

## 📝 MUDANÇA APLICADA

```javascript
// AB0-1-front/next.config.js
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  swcMinify: false,  // ← ADICIONADO (linha 6)
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // ...
}
```

**Arquivo foi modificado localmente e está pronto para commit!** ✅
