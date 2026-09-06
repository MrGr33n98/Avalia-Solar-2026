import { fireEvent, render, screen } from '@testing-library/react';
import { AudienceBuilder } from './AudienceBuilder';

const segments = {
  states: ['RS', 'MT'], cities: ['Cuiabá', 'Porto Alegre'], cities_by_state: { MT: ['Cuiabá'], RS: ['Porto Alegre'] }, company_types: ['Integrador'], tags: [{ id: 12, name: 'Premium' }],
};

describe('AudienceBuilder', () => {
  const props = { filter: { state: '', city: '', segment: '', search: '' }, segments, name: '', onNameChange: jest.fn(), onFilterChange: jest.fn(), onSave: jest.fn(), saving: false };
  beforeEach(() => jest.clearAllMocks());

  it('renders accessible filter controls and save action', () => {
    render(<AudienceBuilder {...props} />);
    expect(screen.getByRole('combobox', { name: 'Estado' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Cidade' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Nome ou e-mail' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar audiência' })).toBeDisabled();
  });

  it('uses only cities from selected state and emits state changes', () => {
    render(<AudienceBuilder {...props} filter={{ ...props.filter, state: 'MT' }} />);
    expect(screen.getByRole('option', { name: 'Cuiabá' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Porto Alegre' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Estado' }), { target: { value: 'RS' } });
    expect(props.onFilterChange).toHaveBeenCalledWith('state', 'RS');
  });

  it('toggles tag filter through accessible pressed state', () => {
    const onFilterChange = jest.fn();
    render(<AudienceBuilder {...props} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Premium' }));
    expect(onFilterChange).toHaveBeenCalledWith('tag_ids', '12');
  });

  it('enables save only with a name and submits callback', () => {
    const onSave = jest.fn();
    render(<AudienceBuilder {...props} name="Integradores MT" onSave={onSave} />);
    const save = screen.getByRole('button', { name: 'Salvar audiência' });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
