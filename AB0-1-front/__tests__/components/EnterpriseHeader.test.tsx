import { render, screen } from '@testing-library/react';
import EnterpriseHeader from '@/app/dashboard/components/EnterpriseHeader';
import { useAuth } from '@/contexts/AuthContext';

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/app/dashboard/components/CommandMenu', () => ({
  CommandMenu: () => <div data-testid="command-menu">command-menu</div>,
}));

describe('EnterpriseHeader', () => {
  const baseCompany = {
    id: 372,
    name: 'WEG',
    city: 'Jaragua do Sul',
    state: 'SC',
    verified: true,
    logo_url: null,
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        id: 10,
        name: 'Membro WEG',
        email: 'weg@example.com',
      },
    });
  });

  it('renders company information without runtime errors', () => {
    render(
      <EnterpriseHeader
        company={baseCompany}
        notifications={[]}
        onMenuClick={() => {}}
        onTabChange={() => {}}
      />
    );

    expect(screen.getByText('WEG')).toBeInTheDocument();
    expect(screen.getByText('Jaragua do Sul, SC')).toBeInTheDocument();
    expect(screen.getByTestId('command-menu')).toBeInTheDocument();
  });

  it('shows unread notifications badge when there are unread items', () => {
    render(
      <EnterpriseHeader
        company={baseCompany}
        notifications={[
          {
            id: 'notif-1',
            type: 'review',
            title: 'Nova avaliacao',
            message: 'Um cliente enviou uma avaliacao',
            timestamp: new Date(),
            read: false,
          },
        ]}
        onMenuClick={() => {}}
        onTabChange={() => {}}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
