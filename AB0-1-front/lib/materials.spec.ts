import { countActiveAssets, formatMaterialFileSize, hasReviewablePdf, materialStatusLabel } from './materials';

describe('regras de materiais', () => {
  it('considera somente PDF não arquivado e não falho revisável', () => {
    expect(hasReviewablePdf([{ kind: 'document', status: 'archived' }, { kind: 'document', status: 'pending', processing_status: 'failed' }, { kind: 'document', status: 'pending', processing_status: 'ready' }])).toBe(true);
  });
  it('conta somente mídias ativas', () => {
    expect(countActiveAssets([{ kind: 'document', status: 'pending' }, { kind: 'image', status: 'archived' }])).toBe(1);
  });
  it('formata tamanho e ausência de PDF', () => {
    expect(formatMaterialFileSize(2 * 1024 * 1024)).toBe('2.0 MB');
    expect(formatMaterialFileSize(null)).toBe('PDF não enviado');
  });
  it('traduz estados conhecidos', () => {
    expect(materialStatusLabel('pending')).toBe('Aguardando revisão');
    expect(materialStatusLabel('unknown')).toBe('unknown');
  });
});
