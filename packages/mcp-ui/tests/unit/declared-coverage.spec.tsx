import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeclaredCoverage } from '../../src/blocks/DeclaredCoverage';

describe('DeclaredCoverage', () => {
  it('does not fabricate coverage when absent', () => {
    const { container } = render(<DeclaredCoverage coverage={{ states: [], cities: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('deduplicates declared states and distinguishes coverage from verification', () => {
    render(<DeclaredCoverage coverage={{ states: ['SC', 'PR', 'SC'], cities: ['Florianópolis'] }} />);
    fireEvent.click(screen.getByText('Cobertura declarada (2 UFs)'));
    expect(screen.getByText(/PR, SC/)).toBeInTheDocument();
    expect(screen.getByText(/Florianópolis/)).toBeInTheDocument();
    expect(screen.getByText(/atendimento não verificado/)).toBeInTheDocument();
  });
});
