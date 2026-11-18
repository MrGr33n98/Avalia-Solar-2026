import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewBrandUsageOptInStep, type ReviewBrandUsageOptInData } from './ReviewBrandUsageOptInStep';

jest.mock('@/components/review-dashboard/brands/BrandCatalogCombobox', () => ({
  BrandCatalogCombobox: ({ selectedBrand, onSelect }: any) => (
    <div data-testid="brand-combobox-mock">
      <span>{selectedBrand ? selectedBrand.name : 'Nenhuma marca'}</span>
      <button
        type="button"
        onClick={() =>
          onSelect({
            id: 1,
            name: 'Growatt Solar',
            slug: 'growatt',
            initials: 'GS',
            logo_url: null,
            status: 'active',
          })
        }
      >
        Selecionar Growatt
      </button>
    </div>
  ),
}));

describe('ReviewBrandUsageOptInStep — PR8 Review Form Brand Source', () => {
  const baseData: ReviewBrandUsageOptInData = {
    optIn: false,
    brand: null,
    usageContext: 'integrator_install',
  };

  it('exibe opções Sim, Não e Agora não', () => {
    render(<ReviewBrandUsageOptInStep data={baseData} onChange={jest.fn()} />);

    expect(screen.getByTestId('opt-in-yes')).toBeInTheDocument();
    expect(screen.getByTestId('opt-in-no')).toBeInTheDocument();
    expect(screen.getByTestId('opt-in-later')).toBeInTheDocument();
  });

  it('não exibe subformulário de seleção quando optIn for false', () => {
    render(<ReviewBrandUsageOptInStep data={baseData} onChange={jest.fn()} />);

    expect(screen.queryByTestId('brand-selection-subform')).not.toBeInTheDocument();
  });

  it('exibe subformulário com combobox e contextos quando optIn for true', () => {
    render(
      <ReviewBrandUsageOptInStep
        data={{ ...baseData, optIn: true }}
        onChange={jest.fn()}
      />
    );

    expect(screen.getByTestId('brand-selection-subform')).toBeInTheDocument();
    expect(screen.getByTestId('brand-combobox-mock')).toBeInTheDocument();
    expect(screen.getByText(/privado por padrão/i)).toBeInTheDocument();
  });

  it('dispara onChange ao clicar em Sim', () => {
    const handleChange = jest.fn();
    render(<ReviewBrandUsageOptInStep data={baseData} onChange={handleChange} />);

    fireEvent.click(screen.getByTestId('opt-in-yes'));
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ optIn: true })
    );
  });

  it('permite selecionar marca e atualizar dados', () => {
    const handleChange = jest.fn();
    render(
      <ReviewBrandUsageOptInStep
        data={{ ...baseData, optIn: true }}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByText('Selecionar Growatt'));
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        brand: expect.objectContaining({ name: 'Growatt Solar' }),
      })
    );
  });
});
