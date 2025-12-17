import type { Card } from '@/types';

export const taxCard: Card = {
  id: 'tax',
  name: 'Tax Planning',
  description: 'Optimize tax deductions and plan ahead',
  icon: 'FileText',
  category: 'Planning',
  parameters: {
    deductionTracking: true,
    yearRoundPlanning: true,
    documentOrganization: 5,
    complianceCheck: true,
  },
  color: '#607D8B',
};
