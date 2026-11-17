import { redirect } from 'next/navigation';

const VALID_TABS = new Set([
  'profile_details',
  'my_reviews',
  'products_used',
  'privacy_settings',
]);

/** Compatibility alias for links created by PR #164. No second dashboard is mounted. */
export default function LegacyUserProfilePage({
  searchParams,
}: {
  searchParams?: { tab?: string | string[] };
}) {
  const tab = typeof searchParams?.tab === 'string' ? searchParams.tab : null;
  if (tab && VALID_TABS.has(tab)) {
    redirect(`/review-dashboard/profile?tab=${encodeURIComponent(tab)}`);
  }
  redirect('/review-dashboard/profile');
}
