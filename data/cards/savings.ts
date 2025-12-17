import type { Card } from '@/types';

export const savingsCard: Card = {
  id: 'savings',
  name: 'Savings Goals',
  description: 'Set and achieve your financial savings targets',
  icon: 'PiggyBank',
  category: 'Planning',
  parameters: {
    goalType: 'Multiple',
    reminderSystem: true,
    progressTracking: 5,
    visualizations: true,
  },
  color: '#FF9800',
};
