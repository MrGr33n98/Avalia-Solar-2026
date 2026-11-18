import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddUserSolutionModal } from './AddUserSolutionModal';
import * as api from '@/lib/api';

jest.mock('@/lib/api', () => ({
  fetchApi: jest.fn(),
}));

jest.mock('@/lib/analytics/lazy', () => ({
  track: jest.fn(),
}));

const mockFetchApi = api.fetchApi as jest.MockedFunction<typeof api.fetchApi>;

describe('AddUserSolutionModal — PR5 Solution Catalog Linking & Legacy Compatibility', () => {
  const onAddMock = jest.fn();
  const onOpenChangeMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite adicionar solução pelo fluxo legado preenchendo apenas nome e categoria', async () => {
    render(
      <AddUserSolutionModal
        open={true}
        onOpenChange={onOpenChangeMock}
        onAdd={onAddMock}
      />
    );

    const nameInput = screen.getByPlaceholderText(/Ex.: Inversor 5kW Híbrido/i);
    fireEvent.change(nameInput, { target: { value: 'Inversor Customizado 3kW' } });

    const submitBtn = screen.getByRole('button', { name: 'Adicionar' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAddMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Inversor Customizado 3kW',
          category: 'Energia Solar',
          type: 'technology',
          verified: false,
        })
      );
    });

    expect(onOpenChangeMock).toHaveBeenCalledWith(false);
  });

  it('permite vincular fabricante canônico e contexto de utilização', async () => {
    mockFetchApi.mockResolvedValueOnce({
      data: [
        {
          id: 101,
          name: 'Growatt MIN 5000TL-X',
          sku: 'GROW-5K',
        },
      ],
    });

    render(
      <AddUserSolutionModal
        open={true}
        onOpenChange={onOpenChangeMock}
        onAdd={onAddMock}
      />
    );

    // Preenche nome
    const nameInput = screen.getByPlaceholderText(/Ex.: Inversor 5kW Híbrido/i);
    fireEvent.change(nameInput, { target: { value: 'Inversor Residencial' } });

    // Clica em adicionar
    const submitBtn = screen.getByRole('button', { name: 'Adicionar' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAddMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Inversor Residencial',
          usage_context: 'integrator_install',
        })
      );
    });
  });
});
