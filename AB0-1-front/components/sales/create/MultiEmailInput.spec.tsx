import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MultiEmailInput, { isValidEmail } from './MultiEmailInput';

describe('MultiEmailInput Component', () => {
  it('valida formato de e-mail corretamente com regex', () => {
    expect(isValidEmail('contato@empresa.com.br')).toBe(true);
    expect(isValidEmail('nome.sobrenome+alias@sub.dominio.com')).toBe(true);
    expect(isValidEmail('invalido')).toBe(false);
    expect(isValidEmail('invalido@')).toBe(false);
    expect(isValidEmail('@sem-usuario.com')).toBe(false);
  });

  it('renderiza chips existentes e chama onChange ao remover um chip', () => {
    const handleChange = jest.fn();
    render(
      <MultiEmailInput
        emails={['primeiro@teste.com', 'segundo@teste.com']}
        onChange={handleChange}
      />
    );

    expect(screen.getByText('primeiro@teste.com')).toBeInTheDocument();
    expect(screen.getByText('segundo@teste.com')).toBeInTheDocument();

    const removeButtons = screen.getAllByTitle(/Remover/);
    fireEvent.click(removeButtons[0]);

    expect(handleChange).toHaveBeenCalledWith(['segundo@teste.com']);
  });

  it('adiciona novo e-mail ao teclar Enter com e-mail válido', () => {
    const handleChange = jest.fn();
    render(<MultiEmailInput emails={[]} onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'novo@empresa.com' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith(['novo@empresa.com']);
  });

  it('suporta múltiplos e-mails colados separados por vírgula ou espaço', () => {
    const handleChange = jest.fn();
    render(<MultiEmailInput emails={['existente@empresa.com']} onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.paste(input, {
      clipboardData: {
        getData: () => 'lead1@empresa.com, lead2@empresa.com ; lead3@empresa.com',
      },
    });

    expect(handleChange).toHaveBeenCalledWith([
      'existente@empresa.com',
      'lead1@empresa.com',
      'lead2@empresa.com',
      'lead3@empresa.com',
    ]);
  });
});
