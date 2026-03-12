import { render, screen } from '@testing-library/react';

import { DashboardStats } from '@/features/dashboard/ui/DashboardStats';

describe('DashboardStats', () => {
  it('renders Teams stat card', () => {
    render(
      <DashboardStats teamsCount={4} chatsCount={12} methodologiesCount={3} />,
    );
    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders Chats stat card', () => {
    render(
      <DashboardStats teamsCount={0} chatsCount={99} methodologiesCount={0} />,
    );
    expect(screen.getByText('Chats')).toBeInTheDocument();
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('renders Methodologies stat card', () => {
    render(
      <DashboardStats teamsCount={0} chatsCount={0} methodologiesCount={7} />,
    );
    expect(screen.getByText('Methodologies')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders zero counts', () => {
    render(
      <DashboardStats teamsCount={0} chatsCount={0} methodologiesCount={0} />,
    );
    const zeros = screen.getAllByText('0');

    expect(zeros).toHaveLength(3);
  });
});
