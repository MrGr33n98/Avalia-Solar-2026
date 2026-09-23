import { getChangeTone } from '@/app/dashboard/components/ranking/RankingEvidence';

describe('RankingEvidence position_change contract', () => {
  it('treats +4 as improvement', () => {
    expect(getChangeTone(4)).toBe('positive');
  });

  it('treats -4 as decline', () => {
    expect(getChangeTone(-4)).toBe('negative');
  });

  it('treats 0 as neutral', () => {
    expect(getChangeTone(0)).toBe('neutral');
  });
});
