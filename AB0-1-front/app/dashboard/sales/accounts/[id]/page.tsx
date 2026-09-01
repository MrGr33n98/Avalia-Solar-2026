'use client';

import { useParams } from 'next/navigation';
import SalesCommandCenter from '@/components/sales/SalesCommandCenter';

export default function SalesAccountPage() {
  const { id } = useParams<{ id: string }>();
  return <SalesCommandCenter pipelineOnly={Boolean(id)} />;
}
