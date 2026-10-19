import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompareCheckboxControl } from './CompareCheckboxControl';

describe('CompareCheckboxControl', () => {
  it('renderiza no estado desmarcado com rótulo "Comparar" e aria-label correto', () => {
    const handleCheckedChange = jest.fn();
    render(
      <CompareCheckboxControl
        companyName="SolarTech"
        checked={false}
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox', {
      name: 'Adicionar SolarTech à comparação',
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText('Comparar')).toBeInTheDocument();
  });

  it('renderiza no estado marcado preservando rótulo "Comparar" e check visual', () => {
    const handleCheckedChange = jest.fn();
    render(
      <CompareCheckboxControl
        companyName="SolarTech"
        checked={true}
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox', {
      name: 'Remover SolarTech da comparação',
    });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toBeChecked();
    // Texto continua "Comparar", NUNCA "Selecionada"
    expect(screen.getByText('Comparar')).toBeInTheDocument();
    expect(screen.queryByText('Selecionada')).not.toBeInTheDocument();
  });

  it('chama onCheckedChange ao clicar no checkbox ou no label', () => {
    const handleCheckedChange = jest.fn();
    render(
      <CompareCheckboxControl
        companyName="SolarTech"
        checked={false}
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it('desabilita interação quando disabled={true}', () => {
    const handleCheckedChange = jest.fn();
    render(
      <CompareCheckboxControl
        companyName="SolarTech"
        checked={false}
        disabled={true}
        onCheckedChange={handleCheckedChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    fireEvent.click(checkbox);
    expect(handleCheckedChange).not.toHaveBeenCalled();
  });

  it('impede a propagação de clique e teclas para elementos pais', () => {
    const parentClick = jest.fn();
    const handleCheckedChange = jest.fn();

    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
      <div onClick={parentClick}>
        <CompareCheckboxControl
          companyName="SolarTech"
          checked={false}
          onCheckedChange={handleCheckedChange}
        />
      </div>
    );

    const label = screen.getByText('Comparar').closest('label')!;
    fireEvent.click(label);

    expect(parentClick).not.toHaveBeenCalled();
  });
});
