// CSS Modules typing for TypeScript (required for `import styles from '*.module.css'`).
// Keeps type-safety (string classnames) and prevents TS2307 during `next build`.

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}
