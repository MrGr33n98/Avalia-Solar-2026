import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { FeaturedCompanies, type FeaturedCompany } from './FeaturedCompanies';
import { useCompareStore } from '@/store/compare';

jest.mock('expo-image', () => {
  const reactNative = jest.requireActual('react-native');
  return { Image: reactNative.Image };
});

function makeCompanies(): FeaturedCompany[] {
  return Array.from({ length: 7 }, (_, index) => ({
    id: String(index + 1),
    name: `Empresa ${index + 1}`,
    slug: `empresa-${index + 1}`,
    logoUrl: `https://example.com/logo-${index + 1}.png`,
    ratingAvg: 4.5,
    reviewsCount: 12,
    isVerified: true,
    city: 'Florianópolis',
    state: 'SC',
  }));
}

describe('FeaturedCompanies', () => {
  beforeEach(() => {
    useCompareStore.setState({ selectedCompanies: [] });
  });

  it('exibe no máximo seis empresas', async () => {
    const view = await render(
      <FeaturedCompanies
        companies={makeCompanies()}
        favorites={[]}
        onToggleFavorite={jest.fn()}
        onPress={jest.fn()}
      />
    );

    expect(view.getByText('Empresa 6')).toBeTruthy();
    expect(view.queryByText('Empresa 7')).toBeNull();
  });

  it('permite favoritar e selecionar uma empresa para comparação', async () => {
    const onToggleFavorite = jest.fn();

    const view = await render(
      <FeaturedCompanies
        companies={makeCompanies().slice(0, 1)}
        favorites={[]}
        onToggleFavorite={onToggleFavorite}
        onPress={jest.fn()}
      />
    );

    await fireEvent.press(view.getByLabelText('Adicionar Empresa 1 aos favoritos'));
    expect(onToggleFavorite).toHaveBeenCalledWith('1');

    await fireEvent.press(view.getByLabelText('Comparar Empresa 1'));
    expect(useCompareStore.getState().selectedCompanies).toHaveLength(1);
    expect(view.getByText('Selecionada')).toBeTruthy();
  });
});
