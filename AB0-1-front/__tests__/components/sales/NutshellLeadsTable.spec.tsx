import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NutshellLeadsTable, NutshellLeadItem } from '@/components/sales/leads/NutshellLeadsTable';

describe('NutshellLeadsTable Tags Column and Filtering', () => {
  const mockTags = [
    { id: 10, name: 'VIP Solar', color: '#10b981' },
    { id: 20, name: 'Urgente', color: '#ef4444' },
  ];

  const mockLeads: NutshellLeadItem[] = [
    {
      id: 101,
      stageKey: 'qualificacao',
      stageName: 'Qualificação',
      company: 'SolarTech Energia',
      plan: 'Plano Pro',
      value: 'R$ 45.000',
      rawCents: 4500000,
      probability: 70,
      contact: 'Carlos Silva',
      status: 'open',
      createdAt: new Date().toISOString(),
      tags: [mockTags[0]],
    },
    {
      id: 102,
      stageKey: 'proposta',
      stageName: 'Proposta',
      company: 'EcoPower Brasil',
      plan: 'Plano Plus',
      value: 'R$ 80.000',
      rawCents: 8000000,
      probability: 50,
      contact: 'Ana Souza',
      status: 'open',
      createdAt: new Date().toISOString(),
      tags: [mockTags[1]],
    },
  ];

  it('renders the Tags column header and tag badges on rows', () => {
    render(
      <NutshellLeadsTable
        leads={mockLeads}
        onSelectLead={jest.fn()}
        allTags={mockTags}
        selectedTagIds={[]}
        onTagFilterChange={jest.fn()}
      />
    );

    // Header has Tags
    const tagsHeaders = screen.getAllByText('Tags');
    expect(tagsHeaders.length).toBeGreaterThan(0);

    // Tags badges rendered
    expect(screen.getAllByText('VIP Solar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Urgente').length).toBeGreaterThan(0);
  });

  it('calls onTagFilterChange when a tag badge is clicked in a row', () => {
    const handleTagFilterChange = jest.fn();

    render(
      <NutshellLeadsTable
        leads={mockLeads}
        onSelectLead={jest.fn()}
        allTags={mockTags}
        selectedTagIds={[]}
        onTagFilterChange={handleTagFilterChange}
      />
    );

    const vipBadges = screen.getAllByText('VIP Solar');
    fireEvent.click(vipBadges[0]);

    expect(handleTagFilterChange).toHaveBeenCalledWith(10);
  });

  it('allows filtering by tag via the column header popover', () => {
    const handleTagFilterChange = jest.fn();

    render(
      <NutshellLeadsTable
        leads={mockLeads}
        onSelectLead={jest.fn()}
        allTags={mockTags}
        selectedTagIds={[]}
        onTagFilterChange={handleTagFilterChange}
      />
    );

    // Click the tag filter button in the header
    const tagFilterButton = screen.getByTitle('Filtrar por tag');
    fireEvent.click(tagFilterButton);

    // Popover content displays tags
    const popoverTags = screen.getAllByText('Urgente');
    // Click on the popover item
    fireEvent.click(popoverTags[popoverTags.length - 1]);

    expect(handleTagFilterChange).toHaveBeenCalledWith(20);
  });

  it('allows toggling off the Tags column via Change columns', () => {
    render(
      <NutshellLeadsTable
        leads={mockLeads}
        onSelectLead={jest.fn()}
        allTags={mockTags}
        selectedTagIds={[]}
        onTagFilterChange={jest.fn()}
      />
    );

    // Open change columns popover
    const changeColsBtn = screen.getByText('Change columns');
    fireEvent.click(changeColsBtn);

    // Find the Tags (Marcadores) toggle
    const tagsCheckbox = screen.getByLabelText(/Tags \(Marcadores\)/i);
    expect(tagsCheckbox).toBeChecked();

    // Toggle off
    fireEvent.click(tagsCheckbox);
    expect(tagsCheckbox).not.toBeChecked();
  });
});
