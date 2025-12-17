import type { Card } from '@/types';

export const debtCard: Card = {
  id: 'debt',
  name: 'Debt Management',
  description: 'Track and strategize debt payoff plans',
  icon: 'CreditCard',
  category: 'Management',
  parameters: {
    payoffStrategy: 'Avalanche',
    interestCalculation: true,
    reminderFrequency: 'Monthly',
    optimizationLevel: 4,
  },
  color: '#F44336',
};
