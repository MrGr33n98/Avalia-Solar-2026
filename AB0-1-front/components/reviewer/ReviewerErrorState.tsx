export function ReviewerErrorState({ onRetry }: { onRetry: () => void }) {
  return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
    <h2 className="font-bold">Não foi possível carregar seu dashboard.</h2>
    <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-lg bg-blue-600 px-4 font-semibold text-white">Tentar novamente</button>
  </div>;
}
