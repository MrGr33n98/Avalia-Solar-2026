# Biblioteca de ícones — Avalia Solar

**47 ícones originais:** 9 categorias principais + 38 subcategorias.

- **Cor:** preto puro `#000000`; sem azul, amarelo ou verde.
- **Formato SVG:** vetorial, `24×24`, `stroke-width="1.8"`, pontas arredondadas.
- **Formato PNG:** fundo transparente, `256×256`.
- **Uso recomendado:** 20–24px no PWA/sidebar; fundo claro.
- **Estrutura:** uma pasta por categoria com `principal/` e `subcategorias/`.
- Os quatro destaques do catálogo reutilizam os SVGs canônicos, sem arquivos duplicados.

## Lista e mapeamento

### A. Energia Solar — 11 subcategorias

- **Principal** `A` — Energia Solar
- `A01` — Baterias e Armazenamento de Energia
- `A02` — Carport Solar / Coberturas Solares
- `A03` — Energia Solar Comercial e Industrial
- `A04` — Energia Solar Residencial
- `A05` — Energia Solar Rural / Agronegócio
- `A06` — Estruturas e Fixação
- `A07` — Financiamento de Energia Solar
- `A08` — Instaladores de Energia Solar
- `A09` — Inversores
- `A10` — Monitoramento e O&M
- `A11` — Painéis Solares

### B. Mobilidade Elétrica — 6 subcategorias

- **Principal** `B` — Mobilidade Elétrica
- `B01` — Carregadores Comerciais e Condomínios
- `B02` — Carregadores Residenciais / Wallbox
- `B03` — Estações Públicas e Postos Rápidos
- `B04` — Instaladores de Carregadores EV
- `B05` — Integração Solar + Mobilidade Elétrica
- `B06` — Veículos Elétricos

### C. Frotas Elétricas — 5 subcategorias

- **Principal** `C` — Frotas Elétricas
- `C01` — Frotas Elétricas Corporativas
- `C02` — Frotas Elétricas para Logística e Entregas
- `C03` — Frotas Elétricas para Mobilidade Urbana
- `C04` — Gestão de Frotas Elétricas
- `C05` — Infraestrutura de Recarga para Frotas

### D. Mercado Livre de Energia — 1 subcategorias

- **Principal** `D` — Mercado Livre de Energia
- `D01` — Mercado Livre de Energia

### E. Hubs de Eletromobilidade e Recarga — 1 subcategorias

- **Principal** `E` — Hubs de Eletromobilidade e Recarga
- `E01` — Hubs de Eletromobilidade e Recarga

### F. Apps, Software e Plataformas — 4 subcategorias

- **Principal** `F` — Apps, Software e Plataformas
- `F01` — Gestão de Recarga VE
- `F02` — Integração Smart Grid
- `F03` — Monitoramento de Energia Solar
- `F04` — Simulação e Projeto Solar

### G. Casa Sustentável e Off-Grid — 3 subcategorias

- **Principal** `G` — Casa Sustentável e Off-Grid
- `G01` — Kits Solares para Autossuficiência
- `G02` — Reuso de Água e Energias Complementares
- `G03` — Soluções para Áreas Remotas

### H. Mercado, Legislação e Finanças — 4 subcategorias

- **Principal** `H` — Mercado, Legislação e Finanças
- `H01` — Legislação e Normas Setoriais
- `H02` — Linhas de Crédito Verde
- `H03` — Seguradoras para Solar e VE
- `H04` — Tendências de Mercado

### I. Sustentabilidade e ESG — 3 subcategorias

- **Principal** `I` — Sustentabilidade e ESG
- `I01` — Carbono Neutro e Compensação
- `I02` — Políticas Corporativas ESG
- `I03` — Selos Verdes e Certificações

## Integração Next.js

Coloque os arquivos `.svg` sob `AB0-1-front/public/icons/categories/` preservando a hierarquia e use o caminho absoluto correspondente de `manifest.json`. Para substituir os ícones atuais, associe cada `id` canônico do banco à sua categoria e ao ícone indicado no manifesto; **não use o nome como identificador de banco sem validar o mapeamento real**.
Não altere contagens de empresas, categorias, filtros ou dados da API. Os ícones são recursos puramente visuais.
O valor de stroke é `#000000`, não `currentColor`, como solicitado. Se o estado ativo necessitar outra cor futuramente, isso exige variante explícita.
Os SVGs são adequados para serem importados como imagem ou transformados em componentes SVG pelo pipeline do projeto.