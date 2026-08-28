export type MaterialAssetState = { kind: string; status: string; processing_status?: string | null; file_size?: number | null };

export function hasReviewablePdf(assets: MaterialAssetState[] = []) {
  return assets.some(asset => asset.kind === 'document' && asset.status !== 'archived' && asset.processing_status !== 'failed');
}

export function countActiveAssets(assets: MaterialAssetState[] = []) {
  return assets.filter(asset => asset.status !== 'archived').length;
}

export function formatMaterialFileSize(bytes?: number | null) {
  return bytes ? (bytes / 1024 / 1024).toFixed(1) + ' MB' : 'PDF não enviado';
}

export function materialStatusLabel(status: string) {
  return ({ published: 'Publicado', pending: 'Em análise', rejected: 'Rejeitado', archived: 'Arquivado', draft: 'Rascunho' } as Record<string, string>)[status] || status;
}
