import type { Meta, StoryObj } from '@storybook/react';
import TopCompanyCard from './TopCompanyCard';

const meta: Meta<typeof TopCompanyCard> = {
  title: 'Components/Company/TopCompanyCard',
  component: TopCompanyCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TopCompanyCard>;

const mockCompany = {
  id: 1,
  name: 'Alpha Solar Pro',
  slug: 'alpha-solar-pro',
  city: 'Florianópolis',
  state: 'SC',
  description: 'Líder em instalações solares residenciais e comerciais de alta performance em Santa Catarina.',
  rating_avg: 4.8,
  rating_count: 150,
  sponsored: true,
  verified: true,
  banner_url: 'https://images.unsplash.com/photo-1509391366360-fe5bb4489a93?auto=format&fit=crop&q=80&w=800',
  logo_url: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=200',
} as any;

export const Gold: Story = {
  args: {
    company: mockCompany,
    rank: 1,
  },
};

export const Silver: Story = {
  args: {
    company: { ...mockCompany, name: 'Beta Energy EV', sponsored: false },
    rank: 2,
  },
};

export const Bronze: Story = {
  args: {
    company: { ...mockCompany, name: 'Gamma Solar Solutions', sponsored: false },
    rank: 3,
  },
};

export const Sponsored: Story = {
  args: {
    company: { ...mockCompany, name: 'Patrocinada Destaque', sponsored: true },
    rank: 4,
  },
};
