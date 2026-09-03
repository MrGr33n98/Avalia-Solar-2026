import Person360FullView from '@/components/sales/people/Person360FullView';

export default async function Person360Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <Person360FullView contactId={resolvedParams.id} />;
}
