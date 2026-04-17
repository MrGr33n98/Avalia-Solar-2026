# 🔐 SEGURANÇA DE SEGREDOS - TOKEN ROTATION & CI CHECK

**Projeto:** Avalia Solar  
**Data:** 2026-03-05  
**Owner:** DevOps + Data Engineer  
**Status:** 🔴 **CRÍTICO - TOKENS EXPOSTOS**

---

## SUMÁRIO EXECUTIVO

**Problema Identificado:** Tokens expostos no Git history

**Tokens Comprometidos:**
- Mixpanel: `47aad0881cd4532d4295c4be5254fad8`
- Arquivo: `AB0-1-front/.env.production` (versionado)

**Ações Imediatas:**
1. ✅ Revogar tokens expostos
2. ✅ Gerar novos tokens
3. ❌ Remover do Git history (BFG)
4. ❌ Implementar CI check (Gitleaks)
5. ❌ Estabelecer rotação periódica

---

## 1. REMEDIAÇÃO IMEDIATA - RUNBOOK

### 1.1 Revogar & Gerar Novo Token Mixpanel

```bash
# 1. Login Mixpanel: https://mixpanel.com/report/[PROJECT_ID]/settings
# 2. Project Settings > Access Security > Reset Token
# 3. Copiar novo token
# 4. Atualizar em Vercel

vercel env add NEXT_PUBLIC_MIXPANEL_TOKEN production
# Input: [NOVO_TOKEN]

# 5. Redeploy
vercel --prod
```

---

### 1.2 Limpar Git History (BFG)

```bash
# Download BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Clone mirror
git clone --mirror git@github.com:org/avaliasolar.git

# Remove file
java -jar bfg-1.14.0.jar --delete-files .env.production avaliasolar.git

# Clean
cd avaliasolar.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push --force
```

---

## 2. CI CHECK - GITLEAKS

### 2.1 GitHub Action

```yaml
# .github/workflows/secrets-scan.yml
name: Secrets Scan
on: [push, pull_request]
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
```

### 2.2 Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
gitleaks protect --staged --verbose || exit 1
```

---

## 3. ROTAÇÃO PERIÓDICA

| Secret | Frequência | Próxima |
|--------|-----------|---------|
| Mixpanel Token | Semestral | 2026-09-05 |
| Rails SECRET_KEY_BASE | Trimestral | 2026-06-05 |

---

## 4. CHECKLIST

- [ ] Tokens revogados
- [ ] Novos tokens gerados
- [ ] Git history limpo
- [ ] Gitleaks CI ativo
- [ ] Pre-commit hook instalado
- [ ] Documentação atualizada

---

**Prazo:** 24 horas  
**Owner:** DevOps  
**Versão:** 1.0
