import type { Card, CoreCombination } from '@/types';

export function generateCombinationInsight(cards: Card[]): CoreCombination {
  const cardIds = cards.map((c) => c.id).sort().join('-');
  const categories = [...new Set(cards.map((c) => c.category))];

  // Generate insights based on card combinations
  const insights: Record<string, CoreCombination> = {
    'budgeting-savings': {
      cards,
      insight: 'Foundation Builder Combo',
      benefits: [
        'Create a solid financial foundation by combining budget tracking with goal-oriented savings',
        'Automatically allocate surplus from budgeting to savings goals',
        'Real-time visibility into how your budget impacts savings progress',
      ],
      synergy: 'This combination creates a powerful feedback loop where budget discipline directly fuels savings achievement.',
    },
    'budgeting-investment': {
      cards,
      insight: 'Wealth Growth Accelerator',
      benefits: [
        'Channel budget surplus into strategic investments',
        'Balance day-to-day spending with long-term wealth building',
        'Automated investment contributions from budget allocations',
      ],
      synergy: 'Budgeting discipline meets investment opportunity, creating a systematic wealth-building machine.',
    },
    'investment-analytics': {
      cards,
      insight: 'Smart Investor Package',
      benefits: [
        'Data-driven investment decisions based on comprehensive analytics',
        'Track investment performance alongside spending patterns',
        'AI-powered predictions for portfolio optimization',
      ],
      synergy: 'Analytics transforms raw investment data into actionable insights for smarter financial decisions.',
    },
    'budgeting-debt': {
      cards,
      insight: 'Debt Destroyer Strategy',
      benefits: [
        'Optimize budget to maximize debt payoff speed',
        'Strategic allocation between living expenses and debt reduction',
        'Clear roadmap to becoming debt-free',
      ],
      synergy: 'Precision budgeting supercharges debt elimination through strategic payment optimization.',
    },
    'analytics-budgeting-investment': {
      cards,
      insight: 'Financial Mastery Suite',
      benefits: [
        'Complete financial visibility across spending, saving, and investing',
        'AI-driven recommendations for optimal resource allocation',
        'Predictive modeling for long-term financial success',
        'Holistic view of your entire financial ecosystem',
      ],
      synergy: 'The ultimate combination for total financial control - track, analyze, and grow your wealth simultaneously.',
    },
    'budgeting-savings-debt': {
      cards,
      insight: 'Financial Recovery Plan',
      benefits: [
        'Balance debt payoff with emergency savings building',
        'Budget optimization for dual goals: debt reduction and savings growth',
        'Prevent future debt through strategic savings',
      ],
      synergy: 'Tackle debt while building financial security - the smart path to financial freedom.',
    },
    'investment-savings-tax': {
      cards,
      insight: 'Tax-Efficient Growth Strategy',
      benefits: [
        'Maximize investment returns through tax optimization',
        'Leverage tax-advantaged savings vehicles',
        'Year-round tax planning for investment decisions',
      ],
      synergy: 'Keep more of what you earn by strategically combining growth and tax efficiency.',
    },
  };

  // Return specific insight or generate generic one
  const specificInsight = insights[cardIds];
  if (specificInsight) {
    return specificInsight;
  }

  // Generic insight for unlisted combinations
  return {
    cards,
    insight: `${categories.join(' + ')} Combination`,
    benefits: [
      `Combine ${cards.length} powerful features for comprehensive financial management`,
      'Unlock synergies across multiple aspects of your financial life',
      'Streamlined workflow with integrated tools working together',
    ],
    synergy: `This ${cards.length}-card combination provides a multifaceted approach to managing your finances effectively.`,
  };
}
