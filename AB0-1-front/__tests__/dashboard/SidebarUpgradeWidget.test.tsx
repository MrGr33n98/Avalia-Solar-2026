import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarUpgradeWidget } from '@/app/dashboard/components/SidebarUpgradeWidget';

describe('SidebarUpgradeWidget', () => {
  it('renders the expanded desktop widget with correct titles and accessible label', () => {
    const handleOpenPlans = jest.fn();
    render(<SidebarUpgradeWidget onOpenPlans={handleOpenPlans} compact={false} />);

    const button = screen.getByRole('button', {
      name: /desbloqueie seu potencial: conhecer planos/i,
    });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Desbloqueie seu potencial')).toBeInTheDocument();
    expect(screen.getByText('Conhecer planos')).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleOpenPlans).toHaveBeenCalledTimes(1);
  });

  it('renders compact mode with accessible tooltip label on compact rail', () => {
    const handleOpenPlans = jest.fn();
    render(<SidebarUpgradeWidget onOpenPlans={handleOpenPlans} compact={true} />);

    const button = screen.getByRole('button', {
      name: /desbloqueie seu potencial: conhecer planos/i,
    });
    expect(button).toBeInTheDocument();
    // In compact mode, the expanded text span is not rendered in DOM
    expect(screen.queryByText('Desbloqueie seu potencial')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(handleOpenPlans).toHaveBeenCalledTimes(1);
  });

  it('respects disabled prop', () => {
    const handleOpenPlans = jest.fn();
    render(<SidebarUpgradeWidget onOpenPlans={handleOpenPlans} disabled={true} />);

    const button = screen.getByRole('button', {
      name: /desbloqueie seu potencial: conhecer planos/i,
    });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleOpenPlans).not.toHaveBeenCalled();
  });
});
