import { render, screen, fireEvent } from '@testing-library/react';
import CRMMobileMoreSheet from '@/components/sales/layout/CRMMobileMoreSheet';

describe('CRMMobileMoreSheet — Menu Móvel de Ações e Módulos', () => {
  it('exibe título, ações rápidas e links de módulos quando aberto', () => {
    render(
      <CRMMobileMoreSheet
        open={true}
        onOpenChange={jest.fn()}
        onOpenAddModal={jest.fn()}
        onOpenSearch={jest.fn()}
      />
    );

    expect(screen.getByText('Mais Ações & Módulos CRM')).toBeInTheDocument();
    expect(screen.getByText('Oportunidade')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByText('Contato')).toBeInTheDocument();
    expect(screen.getByText('Proposta')).toBeInTheDocument();
    expect(screen.getByText('Campanhas & Automações')).toBeInTheDocument();
    expect(screen.getByText('Analytics & Forecast')).toBeInTheDocument();
  });

  it('dispara onOpenAddModal e fecha o sheet ao clicar em um tipo de registro', () => {
    const onOpenAddModalMock = jest.fn();
    const onOpenChangeMock = jest.fn();

    render(
      <CRMMobileMoreSheet
        open={true}
        onOpenChange={onOpenChangeMock}
        onOpenAddModal={onOpenAddModalMock}
        onOpenSearch={jest.fn()}
      />
    );

    const oppBtn = screen.getByText('Oportunidade');
    fireEvent.click(oppBtn);

    expect(onOpenChangeMock).toHaveBeenCalledWith(false);
    expect(onOpenAddModalMock).toHaveBeenCalledWith('opportunity');
  });

  it('dispara onOpenSearch e fecha o sheet ao clicar na barra de busca', () => {
    const onOpenSearchMock = jest.fn();
    const onOpenChangeMock = jest.fn();

    render(
      <CRMMobileMoreSheet
        open={true}
        onOpenChange={onOpenChangeMock}
        onOpenAddModal={jest.fn()}
        onOpenSearch={onOpenSearchMock}
      />
    );

    const searchBtn = screen.getByText(/Buscar empresa, contato ou oportunidade/i);
    fireEvent.click(searchBtn);

    expect(onOpenChangeMock).toHaveBeenCalledWith(false);
    expect(onOpenSearchMock).toHaveBeenCalled();
  });
});
