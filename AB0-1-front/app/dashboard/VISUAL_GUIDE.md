# 🎨 Novo Dashboard - Guia Visual Rápido

## 🚀 Iniciar

```bash
cd AB0-1-front
npm run dev
```

Acesse: **http://localhost:3000/dashboard** → redireciona para → **/dashboard/overview**

---

## 📐 Estrutura Visual

```
┌─────────────────────────────────────────────────────────────┐
│                     DashboardHeader                         │
│  🔍 Busca  |  🔔 Notificações  |  👤 Perfil                │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│  Dash    │  📊 Dashboard                                    │
│  board   │  Visão geral das métricas e atividades          │
│  Side    │                                                  │
│  bar     │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│          │  │👥 2,543 │ │📄 186   │ │📈 24.8% │ │💰 487K  ││
│  📊 Home │  │Empresas │ │Propostas│ │Conversão│ │Receita  ││
│  📈 Anal.│  │+12.5%   │ │+8.2%    │ │+4.3%    │ │+15.7%   ││
│  ⚙️ Config│  └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│  👤 User │                                                  │
│          │  ┌──────────────────────┐ ┌──────────────────────┐│
│ [Toggle] │  │ Crescimento Mensal   │ │ Performance Vendas  ││
│          │  │ ╱╲    Chart Area     │ │ |||   Chart Bar     ││
│          │  │╱  ╲  ╱╲    ╱╲       │ │ |||  |||  |||       ││
│          │  └──────────────────────┘ └──────────────────────┘│
│          │                                                  │
│          │  ┌──────────┐ ┌──────────────────────────────────┐│
│          │  │Activity  │ │ Propostas Recentes              ││
│          │  │ • Item 1 │ │ ┌─────────────────────────────┐││
│          │  │ • Item 2 │ │ │ Empresa | Status | Valor    │││
│          │  │ • Item 3 │ │ │ ABC     | Pend   | R$ 45K  │││
│          │  │ • Item 4 │ │ │ Verde   | Aprov  | R$ 78K  │││
│          │  └──────────┘ │ └─────────────────────────────┘││
│          │                └──────────────────────────────────┘│
└──────────┴──────────────────────────────────────────────────┘
```

---

## 🎨 Paleta de Cores

```
┌─────────────────────────────────────────────────┐
│  🔵 Blue (#0056D2)    → Empresas, Primary       │
│  🟣 Purple (#6C5CE7)  → Propostas, Secondary    │
│  🟢 Green (#34C759)   → Conversões, Success     │
│  🔷 Cyan (#00AFEF)    → Receitas, Finance       │
│  🟡 Yellow (#FCEE21)  → Alertas, Highlight      │
│  ⚫ Gray (#6D6E71)    → Neutro, Muted           │
└─────────────────────────────────────────────────┘
```

---

## 📦 Componentes Principais

### 1. **StatsCard** - Card de Métrica
```tsx
<StatsCard
  title="Total de Empresas"
  value="2,543"
  change={{ value: 12.5, label: 'vs mês anterior' }}
  icon={Users}
  iconColor="blue"
/>
```

**Visual:**
```
┌────────────────────────┐
│ 👥  Total de Empresas  │
│                        │
│ 2,543                  │
│ +12.5% vs mês anterior │
└────────────────────────┘
```

---

### 2. **ChartCard** - Card de Gráfico
```tsx
<ChartCard
  title="Crescimento Mensal"
  description="Número de novas empresas"
>
  <DashboardCharts.AreaChart data={chartData} />
</ChartCard>
```

**Visual:**
```
┌─────────────────────────────┐
│ Crescimento Mensal          │
│ Número de novas empresas    │
│ ┌─────────────────────────┐ │
│ │    ╱╲        ╱╲         │ │
│ │   ╱  ╲  ╱╲  ╱  ╲        │ │
│ │  ╱    ╲╱  ╲╱    ╲       │ │
│ └─────────────────────────┘ │
│ Jan Feb Mar Abr Mai Jun     │
└─────────────────────────────┘
```

---

### 3. **DashboardSidebar** - Navegação
```tsx
// Colapsável: 256px ↔ 80px
<DashboardSidebar />
```

**Visual (Expandida):**
```
┌──────────────┐
│  📊 Overview │
│  📈 Analytics│
│  ⚙️ Settings │
│  👤 Profile  │
│              │
│  [< Collapse]│
└──────────────┘
```

**Visual (Colapsada):**
```
┌────┐
│ 📊 │
│ 📈 │
│ ⚙️ │
│ 👤 │
│    │
│ [>]│
└────┘
```

---

### 4. **DashboardHeader** - Cabeçalho
```tsx
<DashboardHeader />
```

**Visual:**
```
┌─────────────────────────────────────────────────┐
│ [☰] 🔍 Buscar...    🔔 (3)  👤 João Silva  [▼] │
└─────────────────────────────────────────────────┘
```

---

### 5. **DataTable** - Tabela
```tsx
<DataTable 
  title="Propostas Recentes"
  data={tableData}
/>
```

**Visual:**
```
┌──────────────────────────────────────────────┐
│ Propostas Recentes                [Export]   │
├─────────────────┬──────────┬─────────┬───────┤
│ Empresa         │ Status   │ Valor   │ Ações │
├─────────────────┼──────────┼─────────┼───────┤
│ Solar ABC       │ Pendente │ R$ 45K  │ [...]│
│ Energia Verde   │ Aprovado │ R$ 78K  │ [...]│
│ SolarTech       │ Análise  │ R$ 125K │ [...]│
└─────────────────┴──────────┴─────────┴───────┘
```

---

## 🔧 Customização Rápida

### Alterar cores de um card:
```tsx
<StatsCard
  iconColor="purple"  // blue | purple | green | cyan | yellow
/>
```

### Trocar tipo de gráfico:
```tsx
<DashboardCharts.AreaChart data={data} />   // Área
<DashboardCharts.BarChart data={data} />    // Barras
<DashboardCharts.LineChart data={data} />   // Linha
```

### Adicionar nova métrica:
```tsx
const stats = [
  ...statsExistentes,
  {
    title: 'Nova Métrica',
    value: '150',
    change: { value: 5.2, label: 'vs semana anterior' },
    icon: Target,
    iconColor: 'cyan',
  }
];
```

---

## 📱 Responsividade

### Mobile (< 768px):
- Sidebar: Overlay (fechada por padrão)
- Cards: 1 coluna
- Gráficos: Stack vertical

### Tablet (768px - 1024px):
- Sidebar: 80px (colapsada)
- Cards: 2 colunas
- Gráficos: 2 colunas

### Desktop (> 1024px):
- Sidebar: 256px (expandida)
- Cards: 4 colunas
- Gráficos: 2 colunas

---

## ✅ Checklist de Integração

### Para conectar com APIs reais:

1. **[ ] Buscar dados de métricas**
```tsx
const { data: stats } = useQuery('dashboard-stats', fetchStats);
```

2. **[ ] Buscar dados de gráficos**
```tsx
const { data: chartData } = useQuery('chart-data', fetchChartData);
```

3. **[ ] Buscar propostas recentes**
```tsx
const { data: proposals } = useQuery('proposals', fetchProposals);
```

4. **[ ] Implementar ações da tabela**
```tsx
const handleView = (id) => router.push(`/proposals/${id}`);
const handleEdit = (id) => router.push(`/proposals/${id}/edit`);
```

5. **[ ] Conectar busca do header**
```tsx
const handleSearch = (query) => {
  router.push(`/search?q=${query}`);
};
```

---

## 🎯 Resultado Final

✅ Dashboard moderno e profissional
✅ Totalmente responsivo
✅ Segue design system existente
✅ Zero instalações adicionais
✅ Componentes reutilizáveis
✅ Documentação completa

---

**🚀 Pronto para produção após conectar com APIs reais!**

Para mais detalhes, consulte:
- `NOVO_DASHBOARD_README.md` - Guia completo
- `components/README.md` - API dos componentes
- `IMPLEMENTATION_SUMMARY.md` - Resumo técnico
