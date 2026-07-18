import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReviewCategoryStep } from './ReviewCategoryStep';
import { ReviewEditorialStep } from './ReviewEditorialStep';

const categories = [
  { id: 10, name: 'Energia Solar', seo_url: 'energia-solar' },
  { id: 20, name: 'Mobilidade Elétrica', seo_url: 'mobilidade-eletrica' },
];

describe('fluxo Swiss Style de avaliação', () => {
  it('mantém as categorias reais acessíveis como tabs', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(<ReviewCategoryStep categories={categories} selectedId={10} onSelect={onSelect} />);

    expect(screen.getByRole('tab', { name: /energia solar/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    await user.click(screen.getByRole('tab', { name: /mobilidade elétrica/i }));
    expect(onSelect).toHaveBeenCalledWith(20);
  });

  it('preserva título, relato, prós, melhorias e limite da dica', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const data = {
      headline: '',
      pros: [],
      cons: [],
      buyerTip: '',
      comment: '',
    };

    const { rerender } = render(<ReviewEditorialStep data={data} onChange={onChange} />);

    await user.type(screen.getByLabelText(/título da sua avaliação/i), 'Ótimo serviço');
    expect(onChange).toHaveBeenLastCalledWith({ ...data, headline: 'o' });

    fireEvent.change(screen.getByLabelText(/relato detalhado/i), {
      target: { value: 'Atendimento muito cuidadoso.' },
    });
    expect(onChange).toHaveBeenLastCalledWith({
      ...data,
      comment: 'Atendimento muito cuidadoso.',
    });

    rerender(
      <ReviewEditorialStep
        data={{ ...data, buyerTip: 'Peça um cronograma.' }}
        onChange={onChange}
      />
    );
    expect(screen.getByText('19/500')).toBeInTheDocument();
    expect(screen.getByLabelText(/dica do comprador/i)).toHaveAttribute('maxlength', '500');
  });
});
