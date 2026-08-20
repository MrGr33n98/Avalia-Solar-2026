import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyCategoryPicker } from './CompanyCategoryPicker';
import type { CategoryTreeNode } from '@/hooks/useCategoriesTree';

const categories: CategoryTreeNode[] = [
  {
    id: 1,
    name: 'Energia Solar',
    slug: 'energia-solar',
    children: [
      {
        id: 2,
        name: 'Baterias e Armazenamento de Energia',
        slug: 'baterias-armazenamento',
        children: [],
      },
    ],
  },
  {
    id: 3,
    name: 'Energia Solar Comercial e Industrial',
    slug: 'energia-solar-comercial-industrial',
    children: [],
  },
];

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const filterTree = (tree: CategoryTreeNode[], query: string): CategoryTreeNode[] => {
  if (!query) return tree;
  return tree.flatMap((node) => {
    const children = filterTree(node.children || [], query);
    return normalize(node.name).includes(normalize(query)) || children.length > 0
      ? [{ ...node, children }]
      : [];
  });
};

jest.mock('@/hooks/useCategoriesTree', () => ({
  useCategoriesTree: () => ({
    categories,
    loading: false,
    filterCategories: filterTree,
  }),
}));

function ControlledPicker(props: { onConfirm?: () => void; onCancel?: () => void } = {}) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  return (
    <>
      <output aria-label="Categorias selecionadas">{selectedIds.join(',')}</output>
      <CompanyCategoryPicker
        selectedIds={selectedIds}
        onChange={setSelectedIds}
        onClose={() => undefined}
        onConfirm={props.onConfirm}
        onCancel={props.onCancel}
      />
    </>
  );
}

describe('CompanyCategoryPicker', () => {
  it('renderiza raízes, filha e nome longo sem truncamento', () => {
    render(<ControlledPicker />);

    expect(screen.getByText('Energia Solar')).toBeInTheDocument();
    expect(screen.getByText('Baterias e Armazenamento de Energia')).toBeInTheDocument();
    expect(screen.getByText('Energia Solar Comercial e Industrial')).not.toHaveClass('truncate');
    expect(screen.getByText('Baterias e Armazenamento de Energia').closest('label')).toHaveClass(
      'pl-7'
    );
  });

  it('alterna ao tocar no texto e na linha sem disparo duplo', async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);

    await user.click(screen.getByText('Energia Solar'));
    expect(screen.getByLabelText('Categorias selecionadas')).toHaveTextContent('1');

    await user.click(screen.getByText('Energia Solar').closest('label')!);
    expect(screen.getByLabelText('Categorias selecionadas')).toBeEmptyDOMElement();
  });

  it('alterna exatamente uma vez ao tocar diretamente no checkbox', async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);

    await user.click(screen.getByRole('checkbox', { name: 'Selecionar categoria Energia Solar' }));
    expect(screen.getByLabelText('Categorias selecionadas')).toHaveTextContent('1');
  });

  it('permite seleção múltipla', async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);

    await user.click(screen.getByText('Energia Solar'));
    await user.click(screen.getByText('Energia Solar Comercial e Industrial'));
    expect(screen.getByLabelText('Categorias selecionadas')).toHaveTextContent('1,3');
  });

  it('busca sem diferenciar acento ou caixa e limpa a busca', async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    const search = screen.getByRole('textbox', { name: 'Buscar categorias' });

    await user.type(search, 'BATERIA');
    expect(screen.getByText('Baterias e Armazenamento de Energia')).toBeInTheDocument();
    expect(screen.queryByText('Energia Solar Comercial e Industrial')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar busca de categorias' }));
    expect(search).toHaveValue('');
    expect(screen.getByText('Energia Solar Comercial e Industrial')).toBeInTheDocument();
  });

  it('limpa seleção', async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);

    await user.click(screen.getByText('Energia Solar'));
    await user.click(screen.getByRole('button', { name: 'Limpar Seleção' }));
    expect(screen.getByLabelText('Categorias selecionadas')).toBeEmptyDOMElement();
  });

  it('executa confirmar e cancelar', async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<ControlledPicker onConfirm={onConfirm} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('permite alternar por teclado com Space', async () => {
    const user = userEvent.setup();
    render(<ControlledPicker />);
    const checkbox = screen.getByRole('checkbox', { name: 'Selecionar categoria Energia Solar' });

    checkbox.focus();
    await user.keyboard(' ');
    expect(screen.getByLabelText('Categorias selecionadas')).toHaveTextContent('1');
  });
});
