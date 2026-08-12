# Política de mídia de banners

`BannerMedia` é fonte única para renderização de banners comerciais no Web App e PWA.

- `fit="contain"` é padrão para `COMMERCIAL_BANNER` e `COMPANY_BANNER`.
- `fit="cover"` só deve ser explícito em hero decorativo ou slot documentado que aceite corte.
- `position` padrão é `center`.
- O container define geometria e aspect ratio; a imagem nunca define altura do slot.
- `ambientBackground` pode preencher áreas vazias com cópia decorativa desfocada. Essa cópia usa `alt=""` e `aria-hidden`.
- Logos usam `contain`; avatares usam `cover`.

Safe area recomendada para banners horizontais: 5% nas laterais e 8–10% na vertical. Para slots próximos de 6,25:1, referência de upload é 2000 × 320 px.

Mobile usa a mesma política sem reutilizar componente DOM: `resizeMode="contain"` ou `contentFit="contain"` para banners comerciais.
