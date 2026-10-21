import { Loader2 } from 'lucide-react';

export default function FavoritesLoading() {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-label="Carregando favoritos..." />
    </div>
  );
}
