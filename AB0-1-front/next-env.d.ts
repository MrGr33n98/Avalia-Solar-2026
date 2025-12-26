/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: Next gera/usa este arquivo como ponto de entrada de tipos.
// Mantemos aqui o typing de CSS Modules para evitar TS2307 no `next build`.

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
