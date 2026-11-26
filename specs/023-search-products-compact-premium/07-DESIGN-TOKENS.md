# Design tokens — referências a validar

## 6.3. Paleta visual proposta

A implementação deve reutilizar os tokens oficiais existentes, priorizando os seguintes valores de referência:

| Token | Cor | Aplicação |
|---|---|---|
| Surface | `#FFFFFF` | Fundo do card |
| Background | `#F4F6F8` | Fundo da página |
| Border | `#DDE1E6` | Contorno |
| Text primary | `#09172F` | Nome e preço |
| Text secondary | `#475569` | Informações auxiliares |
| Brand blue | `#0F62FE` | Ações e foco |
| Verified background | `#D1FAE5` | Fundo do selo |
| Verified text | `#047857` | Texto do selo |
| Rating | `#F59E0B` | Estrela |
| Hover surface | `#EDF5FF` | Estados interativos |

Sem gradientes desnecessários, glassmorphism, sombras pesadas ou novos elementos decorativos.

## 6.4. Design tokens de densidade

```css
.search-product-card-compact {
  --card-padding: 12px;
  --card-radius: 8px;
  --card-gap: 12px;

  --media-height: 136px;
  --media-padding: 8px;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;

  --title-size: 14px;
  --title-line-height: 18px;

  --price-size: 18px;
  --price-line-height: 24px;

  --cta-height: 36px;
  --transition-duration: 150ms;
}
```

Esses tokens devem ser mapeados ao design system existente, evitando a criação de um sistema paralelo.
