# 🚀 Dashboard - Guia Rápido de Inicialização

## ⚡ Start Rápido (3 comandos)

```bash
# 1. Backend (Terminal 1)
cd AB0-1-back
rails s -p 3001

# 2. Frontend (Terminal 2)
cd AB0-1-front
npm run dev

# 3. Abrir navegador
# http://localhost:3000/dashboard
```

---

## 📋 O que foi implementado

### ✅ **Novo Dashboard Moderno**
- Layout profissional com sidebar colapsável
- 4 cards de KPIs (Empresas, Propostas, Conversão, Receita)
- 2 gráficos interativos (Área + Barras)
- Tabela de propostas recentes
- Feed de atividades

### ✅ **Integração com APIs Reais**
- Dados dinâmicos do backend
- Cache inteligente (React Query)
- Loading states + Error handling
- Atualização automática a cada 1 minuto

---

## 🎯 Endpoints Disponíveis

```bash
# Estatísticas principais
GET /api/v1/dashboard/stats

# Dados para gráficos
GET /api/v1/dashboard/charts/:metric?period=monthly
# metric: companies|revenue|leads
# period: weekly|monthly|quarterly

# Feed de atividades
GET /api/v1/dashboard/activity?limit=10
```

---

## 📁 Arquivos Principais

### Frontend:
```
app/dashboard/
├── overview/page.tsx           ← Página principal integrada
├── components/
│   ├── DashboardLayout.tsx     ← Layout com sidebar
│   ├── StatsCard.tsx           ← Cards de métricas
│   ├── ChartCard.tsx           ← Wrapper de gráficos
│   └── DashboardCharts.tsx     ← Gráficos (Area, Bar, Line)
└── API_INTEGRATION.md          ← Documentação detalhada

lib/
└── api-dashboard.ts            ← Serviço de API
```

### Backend:
```
app/controllers/api/v1/
└── dashboard_controller.rb     ← Controller expandido

config/
└── routes.rb                   ← Rotas configuradas
```

---

## ✅ Checklist de Verificação

Antes de iniciar, certifique-se que:

- [ ] **Backend está rodando** na porta 3001
  ```bash
  curl http://localhost:3001/health
  # Deve retornar: {"status":"ok"}
  ```

- [ ] **Frontend está rodando** na porta 3000
  ```bash
  curl http://localhost:3000
  # Deve retornar HTML
  ```

- [ ] **Banco de dados tem dados**
  ```bash
  cd AB0-1-back
  rails console
  > Company.count
  # Deve retornar > 0
  ```

- [ ] **Usuário está autenticado**
  - Login em: http://localhost:3000/login
  - Dashboard requer autenticação

---

## 🔧 Solução de Problemas

### Problema: Dashboard mostra loading infinito
**Solução:**
1. Verificar se backend está rodando
2. Abrir DevTools (F12) → Console
3. Verificar erros de rede/API
4. Verificar CORS no backend

### Problema: Dados aparecem como "0" ou vazios
**Solução:**
```bash
cd AB0-1-back
rails db:seed  # Popular com dados de exemplo
```

### Problema: Erro de autenticação
**Solução:**
1. Fazer logout: http://localhost:3000/logout
2. Fazer login novamente
3. Verificar se usuário tem permissões

### Problema: Gráficos não aparecem
**Solução:**
1. Verificar se `recharts` está instalado:
   ```bash
   cd AB0-1-front
   npm list recharts
   ```
2. Se não estiver instalado:
   ```bash
   npm install recharts
   ```

---

## 📊 Dados Exibidos

| Métrica | Fonte | Atualização |
|---------|-------|-------------|
| Total de Empresas | `Company.count` | 1 min |
| Propostas Ativas | `Lead.count` | 1 min |
| Taxa de Conversão | `reviews/leads` | 1 min |
| Receita Total | `calculate_revenue()` | 1 min |
| Gráficos | Agregação mensal | 10 min |
| Propostas | `Lead.recent(10)` | 2 min |
| Atividades | Multi-source feed | Real-time |

---

## 🎨 Personalização Rápida

### Alterar cores dos cards:
```tsx
// app/dashboard/overview/page.tsx
<StatsCard
  iconColor="blue"  // blue|purple|green|cyan|yellow
/>
```

### Alterar período dos gráficos:
```tsx
queryFn: () => dashboardApi.fetchChartData('companies', 'weekly')
//                                          ↑           ↑
//                                       metric      period
```

### Alterar limite de propostas:
```tsx
queryFn: () => dashboardApi.fetchRecentProposals(20)
//                                               ↑
//                                            limite
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

| Arquivo | Conteúdo |
|---------|----------|
| **README_FINAL.md** | Resumo executivo completo |
| **API_INTEGRATION.md** | Documentação de integração |
| **VISUAL_GUIDE.md** | Guia visual com diagramas |
| **NOVO_DASHBOARD_README.md** | Guia de uso |
| **components/README.md** | API dos componentes |

---

## 🎯 Próximos Passos

1. **Popular banco com dados reais** (se necessário)
2. **Testar todos os endpoints** da API
3. **Personalizar métricas** conforme necessidade
4. **Adicionar filtros de data** (opcional)
5. **Implementar exportação** (opcional)

---

## 📞 Suporte

**Problema técnico?**
1. Consulte `API_INTEGRATION.md` → Seção Troubleshooting
2. Verifique logs:
   - Backend: `AB0-1-back/log/development.log`
   - Frontend: DevTools Console (F12)

**Dúvida sobre uso?**
1. Consulte `VISUAL_GUIDE.md` para exemplos visuais
2. Consulte `README_FINAL.md` para visão geral

---

## ✨ Status

✅ **Dashboard implementado e funcionando**  
✅ **APIs integradas com dados reais**  
✅ **Cache e performance otimizados**  
✅ **Documentação completa fornecida**  
✅ **Pronto para uso em desenvolvimento**  

---

**🚀 Bom trabalho! O dashboard está pronto para uso.**

Para iniciar: execute os 3 comandos no topo deste arquivo.
