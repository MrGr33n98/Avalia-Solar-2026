'use client';

import { useParams, redirect } from 'next/navigation';

export default function RedirectPage() {
  const params = useParams<{ id: string }>();
  redirect(`/creator-studio/publications/${params.id}/edit`);
}
