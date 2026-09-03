# Canonical CreateLeadModal Form Specification

## Layout Proportions
- Desktop Width: `max-w-[540px]` (500–540px target benchmark)
- Header: Fixed bar with title "Adicionar Lead", "Personalizar campos" button, and close icon.
- Body: Scrollable container with 16px internal padding and 20px grid row gap.
- Footer: Fixed bar with "Cancelar" and primary "Criar Lead" button.

## Fields & Controls
1. **Nome do Lead \***: Text input, required.
2. **Pipeline**: Select trigger, loads active pipelines.
3. **Estágio**: Select trigger, dynamically loads pipeline stages.
4. **Lead Quente 🔥**: Toggle button or badge (`temperature: hot` vs `cold`).
5. **Responsável**: Select trigger for owner selection.
6. **Previsão de Fechamento**: Date picker input (`expected_close_date`).
7. **Receita / Produtos**: Product line item editor (unit price in cents).
8. **Confiança %**: Number slider/input (0–100%).
9. **Empresa (Account)**: Searchable combobox + inline creation.
10. **Pessoas (Contacts)**: Multi-contact selector with roles.
11. **Origem (Source)**: Select dropdown.
12. **Concorrentes (Competitors)**: Multi-select dropdown + inline creation.
