# Guia de Estilo - Avalia Solar

Este guia documenta a nova paleta de cores oficial e as diretrizes de uso para a interface do Avalia Solar, baseada nas cores do logotipo.

## 🎨 Paleta de Cores

As cores foram extraídas diretamente do logotipo oficial e configuradas para garantir acessibilidade (WCAG 2.1).

### Cores Principais

| Cor | Hexadecimal | Variável CSS | Uso Recomendado |
| :--- | :--- | :--- | :--- |
| **Navy (Azul Escuro)** | `#004996` | `--primary` | Cor primária da marca. Usada em cabeçalhos, botões principais e elementos de destaque. |
| **Cyan (Ciano)** | `#00AFEF` | `--secondary` | Cor secundária. Usada para acentos, ícones, e elementos interativos. |
| **Green (Verde)** | `#8DC63F` | `--accent` | Cor de destaque/sucesso. Usada para confirmações e elementos positivos. |
| **Yellow (Amarelo)** | `#FCEE21` | `--chart-4` | Usada para avaliações (estrelas) e alertas de atenção. |

### Cores de Suporte

| Cor | Hexadecimal | Variável CSS | Uso Recomendado |
| :--- | :--- | :--- | :--- |
| **Deep Gray** | `#6D6E71` | `--brand-gray` | Textos secundários e bordas sutis. |
| **White** | `#FFFFFF` | `--background` | Fundo principal e texto sobre cores escuras. |
| **Dark Gray** | `#1A1A1A` | `--foreground` | Texto principal para máxima legibilidade. |

---

## 🛠️ Implementação Técnica

### Tailwind CSS
Você pode usar as cores através das classes utilitárias do Tailwind:

- **Primary (Navy):** `bg-primary`, `text-primary`, `border-primary`
- **Secondary (Cyan):** `bg-secondary`, `text-secondary`, `border-secondary`
- **Accent (Green):** `bg-accent`, `text-accent`

### Variáveis CSS (HSL)
As cores estão definidas em `app/globals.css` usando o formato HSL para facilitar ajustes de transparência:

```css
:root {
  --primary: 211 100% 29%;     /* #004996 */
  --secondary: 196 100% 47%;   /* #00AFEF */
  --accent: 85 55% 51%;        /* #8DC63F */
}
```

---

## ♿ Acessibilidade (WCAG 2.1)

Para manter a conformidade com o nível AA da WCAG, siga estas regras de contraste:

| Combinação | Proporção | Resultado WCAG 2.1 | Recomendação |
| :--- | :--- | :--- | :--- |
| **Navy sobre Branco** | 10.4:1 | **Passa AAA** | Ideal para todo tipo de texto. |
| **Cyan sobre Dark Gray** | 7.2:1 | **Passa AAA** | Melhor combinação para legibilidade com Ciano. |
| **Yellow sobre Dark Gray** | 14.6:1 | **Passa AAA** | Excelente contraste para alertas e destaques. |
| **Cyan sobre Branco** | 2.4:1 | **Falha AA** | Use apenas para ícones grandes ou elementos decorativos. |
| **Green sobre Branco** | 2.0:1 | **Falha AA** | Use apenas para ícones ou badges com bordas escuras. |

### Regras de Ouro:
1.  **Sobre Fundo Navy (`#004996`):** Use sempre texto **Branco**.
2.  **Sobre Fundo Cyan (`#00AFEF`):** Use sempre texto **Dark Gray** ou **Preto**. **NUNCA** use texto branco sobre ciano para textos pequenos.
3.  **Sobre Fundo Branco:**
    - Use **Navy** para texto normal e links.
    - O **Cyan** pode ser usado para ícones ou textos grandes (acima de 24px), mas evite para texto corrido.

---

## 📐 Regras de Uso

- **Botões:** O botão de ação principal (CTA) deve preferencialmente usar a cor **Navy** com texto branco para maior contraste e seriedade.
- **Destaques:** Use o **Cyan** para badges, estados de hover sutis e ícones decorativos.
- **Estados:**
  - **Sucesso:** Verde (`--accent`)
  - **Aviso:** Amarelo (`--chart-4`)
  - **Erro:** Vermelho padrão (`--destructive`)
