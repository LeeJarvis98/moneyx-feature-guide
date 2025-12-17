import type { Card } from '@/types';

export const budgetingCard: Card = {
  id: 'budgeting',
  name: 'Budgeting',
  description: 'Track and manage your monthly budget with precision',
  icon: 'Wallet',
  category: 'Planning',
  parameters: {
    trackingFrequency: 'Monthly',
    automationLevel: 'High',
    complexity: 3,
    userFriendly: true,
  },
  color: '#FFB81C',
};
