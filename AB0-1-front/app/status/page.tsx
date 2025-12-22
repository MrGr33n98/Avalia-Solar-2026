const getStatusUrl = () => {
  const rawBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';
  const origin = rawBase.replace(/\/api\/v1\/?$/i, '').replace(/\/+$/, '');
  return `${origin}/health`;
};

export default function StatusPage() {
  const statusUrl = getStatusUrl();

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">Status</h1>
        <p className="text-lg text-muted-foreground">
          Pagina em construcao. Voce pode acompanhar o status da API no link abaixo.
        </p>
        <div className="mt-6">
          <a
            href={statusUrl}
            className="text-primary underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            {statusUrl}
          </a>
        </div>
      </div>
    </div>
  );
}
