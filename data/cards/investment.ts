import type { Card } from '@/types';

export const investmentCard: Card = {
  id: 'investment',
  name: 'Investment Tracking',
  description: 'Monitor your investment portfolio and returns',
  icon: 'TrendingUp',
  category: 'Growth',
  parameters: {
    riskLevel: 'Medium',
    timeHorizon: 'Long-term',
    diversification: 4,
    realTimeUpdates: true,
  },
  color: '#2196F3',
};
