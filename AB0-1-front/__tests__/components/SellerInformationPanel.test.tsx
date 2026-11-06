import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SellerInformationPanel, {
  type SellerEditorMode,
  type SellerPublicDetails,
} from '@/app/dashboard/components/SellerInformationPanel';

const exampleCompany: SellerPublicDetails = {
  id: '372',
  slug: 'empresa-solar-exemplo',
  name: 'Energia Solar Exemplo',
  website: 'https://empresa-exemplo.com.br',
  cnpj: '12.345.678/0001-90',
  city: 'Florianópolis',
  state: 'SC',
  description: 'Empresa de energia solar.',
  founded_year: 2020,
  employees_count: 12,
  linkedin: 'https://www.linkedin.com/company/exemplo',
  email_public: 'contato@empresa-exemplo.com.br',
};

function SellerPanelHarness({
  onSave = jest.fn().mockResolvedValue(undefined),
  onRefresh = jest.fn().mockResolvedValue(undefined),
}: {
  onSave?: jest.Mock;
  onRefresh?: jest.Mock;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<SellerEditorMode>('profile');
  const [draft, setDraft] = useState<SellerPublicDetails>(exampleCompany);

  return (
    <SellerInformationPanel
      company={exampleCompany}
      draft={draft}
      editorOpen={open}
      editorMode={mode}
      saving={false}
      refreshing={false}
      onEdit={(editorMode) => {
        setDraft(exampleCompany);
        setMode(editorMode);
        setOpen(true);
      }}
      onEditorOpenChange={setOpen}
      onFieldChange={(field, value) => setDraft((previous) => ({ ...previous, [field]: value }))}
      onSave={onSave}
      onRefresh={onRefresh}
    />
  );
}

describe('SellerInformationPanel — referência visual G2', () => {
  it('apresenta dados do perfil público e ação de caneta acessível', () => {
    render(<SellerPanelHarness />);

    expect(screen.getByRole('heading', { name: 'Informações da empresa' })).toBeInTheDocument();
    expect(screen.getByText('Energia Solar Exemplo')).toBeInTheDocument();
    expect(screen.getByText('Florianópolis, SC')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar informações da empresa' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('abre o modal ao clicar na caneta, permite editar e chama a ação existente de salvamento', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<SellerPanelHarness onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar informações da empresa' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Editar informações da empresa' })).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Nome da empresa');
    fireEvent.change(nameInput, { target: { value: 'Novo nome de teste' } });
    expect(nameInput).toHaveValue('Novo nome de teste');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it('cancela a edição pelo modal sem salvar', () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<SellerPanelHarness onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar informações da empresa' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('mantém o link de perfil não editável e permite atualizar os dados', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    render(<SellerPanelHarness onRefresh={onRefresh} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar informações da empresa' }));
    expect(screen.getByDisplayValue('https://www.avaliasolar.com.br/companies/empresa-solar-exemplo')).toHaveAttribute('readonly');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar informações da empresa' }));
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
  });
});
