import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactMethodsModal } from '@/components/sales/people/ContactMethodsModal';
import { salesApi, ApiContactMethod } from '@/lib/api/sales/client';

jest.mock('@/lib/api/sales/client', () => {
  const actual = jest.requireActual('@/lib/api/sales/client');
  return {
    ...actual,
    salesApi: {
      getContactMethods: jest.fn(),
      createContactMethod: jest.fn(),
      updateContactMethod: jest.fn(),
      setPrimaryContactMethod: jest.fn(),
      archiveContactMethod: jest.fn(),
    },
  };
});

describe('ContactMethodsModal', () => {
  const mockMethods: ApiContactMethod[] = [
    {
      id: 1,
      contact_id: 10,
      kind: 'email',
      value: 'carlos@empresa.com.br',
      normalized_value: 'carlos@empresa.com.br',
      label: 'Trabalho',
      is_primary: true,
      position: 0,
      source: 'manual',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      contact_id: 10,
      kind: 'email',
      value: 'carlos.pessoal@gmail.com',
      normalized_value: 'carlos.pessoal@gmail.com',
      label: 'Pessoal',
      is_primary: false,
      position: 1,
      source: 'manual',
      created_at: new Date().toISOString(),
    },
    {
      id: 3,
      contact_id: 10,
      kind: 'phone',
      value: '(11) 98765-4321',
      normalized_value: '+5511987654321',
      label: 'Comercial',
      is_primary: true,
      position: 0,
      source: 'manual',
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (salesApi.getContactMethods as jest.Mock).mockResolvedValue(mockMethods);
  });

  it('renders modal with title and loaded contact methods', async () => {
    render(
      <ContactMethodsModal
        open={true}
        onOpenChange={jest.fn()}
        contactId={10}
        contactName="Carlos Ferreira"
        initialMethods={mockMethods}
      />
    );

    expect(screen.getByText('Gerenciar Informações de Contato')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ferreira')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('carlos@empresa.com.br')).toBeInTheDocument();
      expect(screen.getByText('carlos.pessoal@gmail.com')).toBeInTheDocument();
      expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
    });
  });

  it('allows switching primary contact method', async () => {
    const updatedMethod = { ...mockMethods[1], is_primary: true };
    (salesApi.setPrimaryContactMethod as jest.Mock).mockResolvedValue(updatedMethod);

    const onMethodsUpdated = jest.fn();

    render(
      <ContactMethodsModal
        open={true}
        onOpenChange={jest.fn()}
        contactId={10}
        contactName="Carlos Ferreira"
        initialMethods={mockMethods}
        onMethodsUpdated={onMethodsUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('carlos.pessoal@gmail.com')).toBeInTheDocument();
    });

    const setPrimaryButtons = screen.getAllByTitle('Tornar este canal o principal');
    expect(setPrimaryButtons.length).toBeGreaterThan(0);

    fireEvent.click(setPrimaryButtons[0]);

    await waitFor(() => {
      expect(salesApi.setPrimaryContactMethod).toHaveBeenCalledWith(10, 2);
    });
  });

  it('allows adding a new contact method via form', async () => {
    const newMethod: ApiContactMethod = {
      id: 4,
      contact_id: 10,
      kind: 'whatsapp',
      value: '(11) 99999-8888',
      normalized_value: '+5511999998888',
      label: 'Trabalho',
      is_primary: true,
      position: 0,
      source: 'manual',
      created_at: new Date().toISOString(),
    };
    (salesApi.createContactMethod as jest.Mock).mockResolvedValue(newMethod);

    render(
      <ContactMethodsModal
        open={true}
        onOpenChange={jest.fn()}
        contactId={10}
        contactName="Carlos Ferreira"
        initialMethods={mockMethods}
      />
    );

    // Click "Adicionar Canal"
    const addBtn = screen.getByRole('button', { name: /adicionar canal/i });
    fireEvent.click(addBtn);

    // Form opens
    expect(screen.getByText('Novo Canal de Contato')).toBeInTheDocument();

    // Select type whatsapp
    const kindSelect = screen.getByLabelText(/tipo de canal/i);
    fireEvent.change(kindSelect, { target: { value: 'whatsapp' } });

    // Fill value
    const valueInput = screen.getByLabelText(/valor/i);
    fireEvent.change(valueInput, { target: { value: '(11) 99999-8888' } });

    // Submit form
    const saveBtn = screen.getByRole('button', { name: /salvar canal/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(salesApi.createContactMethod).toHaveBeenCalledWith(10, expect.objectContaining({
        kind: 'whatsapp',
        value: '(11) 99999-8888',
      }));
    });
  });

  it('allows triggering contextual actions (Send email)', async () => {
    const onSendEmail = jest.fn();

    render(
      <ContactMethodsModal
        open={true}
        onOpenChange={jest.fn()}
        contactId={10}
        contactName="Carlos Ferreira"
        initialMethods={mockMethods}
        onSendEmail={onSendEmail}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('carlos.pessoal@gmail.com')).toBeInTheDocument();
    });

    const sendEmailButtons = screen.getAllByTitle('Enviar e-mail para este endereço');
    fireEvent.click(sendEmailButtons[1]); // second email

    expect(onSendEmail).toHaveBeenCalledWith('carlos.pessoal@gmail.com');
  });

  it('opens confirmation when archiving a contact method', async () => {
    render(
      <ContactMethodsModal
        open={true}
        onOpenChange={jest.fn()}
        contactId={10}
        contactName="Carlos Ferreira"
        initialMethods={mockMethods}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('carlos@empresa.com.br')).toBeInTheDocument();
    });

    const archiveButtons = screen.getAllByTitle('Arquivar canal');
    fireEvent.click(archiveButtons[0]);

    // Shows archive confirmation
    expect(screen.getByText(/arquivar canal de contato/i)).toBeInTheDocument();
    expect(screen.getByText(/confirmar arquivamento/i)).toBeInTheDocument();
  });
});
