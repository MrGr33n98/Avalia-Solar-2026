const getDocsUrl = () => {
  const rawBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';
  const origin = rawBase.replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '');
  return `${origin}/api-docs`;
};

export default function ApiDocsPage() {
  const docsUrl = getDocsUrl();

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">API Docs</h1>
        <p className="text-lg text-muted-foreground">
          A documentacao da API esta disponivel no link abaixo.
        </p>
        <div className="mt-6">
          <a
            href={docsUrl}
            className="text-primary underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            {docsUrl}
          </a>
        </div>
      </div>
    </div>
  );
}
