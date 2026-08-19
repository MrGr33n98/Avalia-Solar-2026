import fs from 'fs';
import path from 'path';

const ROOTS_TO_SCAN = ['app', 'components', 'hooks'];
const DEPRECATED_PATTERNS = [
  '@/lib/dataLayer',
  '@/lib/dataLayer',
  '@/lib/posthog',
  '../lib/posthog',
  "from 'posthog-js'",
  'from "posthog-js"',
  'posthog.capture(',
];
const ALLOWED_FILES = new Set<string>(['components/PostHogProvider.tsx']);

function collectSourceFiles(root: string): string[] {
  const absoluteRoot = path.join(process.cwd(), root);
  if (!fs.existsSync(absoluteRoot)) return [];

  const files: string[] = [];
  const stack = [absoluteRoot];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__') continue;
        stack.push(absolutePath);
        continue;
      }

      if (!/\.(ts|tsx|js|jsx)$/.test(entry.name)) continue;
      files.push(absolutePath);
    }
  }

  return files;
}

function relativeSourcePath(file: string): string {
  return path.relative(process.cwd(), file).replace(/\\/g, '/');
}

describe('analytics deprecated imports', () => {
  it('does not allow app/components code to import deprecated analytics libraries', () => {
    const offendingFiles = ROOTS_TO_SCAN.flatMap((root) => collectSourceFiles(root))
      .filter((file) => !ALLOWED_FILES.has(relativeSourcePath(file)))
      .filter((file) => {
        const content = fs.readFileSync(file, 'utf8');
        return DEPRECATED_PATTERNS.some((pattern) => content.includes(pattern));
      })
      .map(relativeSourcePath);

    expect(offendingFiles).toEqual([]);
  });
});
