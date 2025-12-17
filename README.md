# MoneyX Feature Guide

A modern web application built with Next.js 15, Mantine UI, and Lucide icons that helps users discover powerful financial feature combinations.

## Features

- **Interactive Card Selection**: Click on feature cards to add them to the core
- **Smart Combinations**: The core analyzes selected cards and provides comprehensive insights
- **Modular Card Data**: Each card's attributes are stored in separate files for easy maintenance
- **Beautiful UI**: Built with Mantine UI components and Lucide icons
- **TypeScript**: Full type safety throughout the application
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Project Structure

\\\
moneyx_feature_guide/
 app/
    layout.tsx          # Root layout with Mantine provider
    page.tsx            # Main page component
    globals.css         # Global styles
 components/
    FeatureCard.tsx     # Card component for available features
    CoreCard.tsx        # Card component for selected features in core
    InsightPanel.tsx    # Panel showing combination insights
├ data/
    cards/              # Individual card data files
       budgeting.ts
       investment.ts
       savings.ts
       analytics.ts
       debt.ts
       tax.ts
    index.ts            # Exports all cards
 lib/
    combinations.ts     # Logic for generating combination insights
 types/
    index.ts            # TypeScript type definitions
 package.json
\\\

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Install dependencies:

\\\ash
npm install
\\\

2. Run the development server:

\\\ash
npm run dev
\\\

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Cards

The application includes six financial feature cards:

1. **Budgeting** - Track and manage your monthly budget
2. **Investment Tracking** - Monitor your investment portfolio
3. **Savings Goals** - Set and achieve financial targets
4. **Financial Analytics** - Deep insights into spending patterns
5. **Debt Management** - Track and strategize debt payoff
6. **Tax Planning** - Optimize tax deductions

## Adding New Cards

To add a new card:

1. Create a new file in \data/cards/\:

\\\	ypescript
import type { Card } from '@/types';

export const myNewCard: Card = {
  id: 'my-new-feature',
  name: 'My New Feature',
  description: 'Description of the feature',
  icon: 'IconName', // Lucide icon name
  category: 'Category',
  parameters: {
    param1: 'value1',
    param2: true,
  },
  color: '#HEX_COLOR',
};
\\\

2. Export it in \data/index.ts\:

\\\	ypescript
import { myNewCard } from './cards/my-new-feature';

export const allCards = [
  // ...existing cards,
  myNewCard,
];
\\\

3. Add combination insights in \lib/combinations.ts\

## Technologies Used

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript** - Type safety
- **Mantine UI** - Modern React component library
- **Lucide React** - Beautiful icon pack
- **CSS Modules** - Scoped styling

## Scripts

- \
pm run dev\ - Start development server
- \
pm run build\ - Build for production
- \
pm run start\ - Start production server
- \
pm run lint\ - Run ESLint

## License

MIT
