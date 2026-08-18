import { redirect } from 'next/navigation';

export default function FavoritesShortcutPage() {
  redirect('/review-dashboard/favorites');
}
