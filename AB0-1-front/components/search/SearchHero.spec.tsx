import { fireEvent, render, screen } from '@testing-library/react';
import { SearchHero } from './SearchHero';

const baseProps = {
  searchTerm: '',
  locationTerm: '',
  onSearchTermChange: jest.fn(),
  onLocationTermChange: jest.fn(),
  onSubmit: jest.fn((event: React.FormEvent) => event.preventDefault()),
};

describe('SearchHero iOS mobile search', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uses explicit 16px font size for both text fields below the desktop breakpoint', () => {
    render(<SearchHero {...baseProps} />);

    const queryInput = screen.getByRole('textbox', { name: 'Buscar empresa, produto ou serviço' });
    const locationInput = screen.getByRole('textbox', { name: 'CEP ou cidade' });

    expect(queryInput).toHaveClass('text-[16px]', 'md:text-sm', 'min-w-0');
    expect(locationInput).toHaveClass('text-[16px]', 'md:text-sm', 'min-w-0');
  });

  it('blurs the focused field before calling the submit handler', () => {
    render(<SearchHero {...baseProps} searchTerm="energia solar" />);

    const input = screen.getByRole('textbox', { name: 'Buscar empresa, produto ou serviço' });
    input.focus();
    expect(input).toHaveFocus();

    fireEvent.submit(input.closest('form')!);

    expect(input).not.toHaveFocus();
    expect(baseProps.onSubmit).toHaveBeenCalledTimes(1);
  });
});
