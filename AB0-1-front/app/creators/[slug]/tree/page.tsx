import { notFound } from 'next/navigation';
import { publicCreatorTreeApi, type PublicCreatorTreeResponse } from '@/lib/api/creatorTree';
import { CreatorTreeViewTracker } from '@/components/creator/tree/CreatorTreeViewTracker';
import { TreeRenderer } from '@/components/creator/tree/TreeRenderer';

type Props = { params: { slug: string } };

async function getTree(slug: string): Promise<PublicCreatorTreeResponse | null> {
  try {
    return await publicCreatorTreeApi.get(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const data = await getTree(params.slug);
  if (!data) return { title: 'Creator não encontrado | Avalia Solar' };

  const title = `${data.creator.name} | Avalia Solar`;
  const description = data.creator.headline || data.creator.bio || 'Conheça os principais links deste creator.';
  return { title, description, alternates: { canonical: `/creators/${params.slug}/tree` }, openGraph: { title, description, type: 'profile' } };
}

export default async function PublicCreatorTreePage({ params }: Props) {
  const data = await getTree(params.slug);
  if (!data) notFound();

  return (
    <>
      <CreatorTreeViewTracker slug={params.slug} />
      <TreeRenderer data={data} />
    </>
  );
}