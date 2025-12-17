# Quick Start Guide

## What You Built

**MoneyX Feature Guide** - An interactive web app where users select financial feature cards and discover powerful combinations through the "Core" system.

## Running the Application

```bash
npm run dev
```

Visit: http://localhost:3000

## How It Works

1. **Browse Features**: Six financial feature cards are displayed
2. **Select Cards**: Click any card to add it to the Core
3. **See Insights**: The Core analyzes combinations and shows:
   - Combination name/title
   - Synergy description
   - List of benefits

## Example Combinations to Try

- **Budgeting + Savings**  "Foundation Builder Combo"
- **Investment + Analytics**  "Smart Investor Package"
- **Budgeting + Debt**  "Debt Destroyer Strategy"
- **Budgeting + Analytics + Investment**  "Financial Mastery Suite"

## Project Structure

```
 app/
    layout.tsx       # Mantine provider setup
    page.tsx         # Main page with state management
    globals.css      # Global styles
 components/
    FeatureCard.tsx  # Clickable feature cards
    CoreCard.tsx     # Cards in the Core
    InsightPanel.tsx # Combination insights display
 data/
    cards/           #  Each card in its own file
       budgeting.ts
       investment.ts
       savings.ts
       analytics.ts
       debt.ts
       tax.ts
    index.ts         # Exports all cards
 lib/
    combinations.ts  # Combination logic
 types/
     index.ts         # TypeScript types
```

## Key Features

 Modular card data (each card = separate file)
 TypeScript for type safety
 Mantine UI for beautiful components
 Lucide icons for visual appeal
 Real-time combination insights
 Responsive design

## Customization

### Add a New Card

1. Create `data/cards/your-card.ts`:
```typescript
import type { Card } from '@/types';

export const yourCard: Card = {
  id: 'your-feature',
  name: 'Your Feature',
  description: 'What it does',
  icon: 'IconName',  // From lucide-react
  category: 'Planning',
  parameters: {
    param1: 'value',
  },
  color: '#FF5722',
};
```

2. Add to `data/index.ts`:
```typescript
import { yourCard } from './cards/your-card';

export const allCards = [
  // existing cards...
  yourCard,
];
```

3. Refresh the page!

### Add Combination Insight

Edit `lib/combinations.ts`:
```typescript
const insights: Record<string, CoreCombination> = {
  'card1-card2': {
    cards,
    insight: 'Combo Name',
    benefits: ['Benefit 1', 'Benefit 2'],
    synergy: 'How they work together',
  },
  // more combinations...
};
```

## Tech Stack

- **Next.js 15** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Mantine UI 7** - Component library
- **Lucide React** - Icons

## Development Commands

```bash
npm run dev    # Start dev server
npm run build  # Build for production
npm run start  # Start production server
npm run lint   # Run linting
```

## Tips

- Cards highlight when selected
- Click selected cards again to deselect
- Use "Clear All" button to reset
- Add 2-3 cards for best combination insights
- Check the console for any errors

Enjoy building your feature guide! 
