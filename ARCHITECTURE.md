# MoneyX Feature Guide - Architecture Guide

## Overview

MoneyX Feature Guide is a web application that demonstrates how different financial features work together to create powerful combinations. Users can select features and see comprehensive insights about their synergies.

## Key Concepts

### 1. Cards
Each financial feature is represented as a **Card** with:
- Unique identifier
- Name and description
- Icon (from Lucide icons)
- Category (Planning, Growth, Insights, Management)
- Parameters (specific attributes)
- Color theme

### 2. Core
The **Core** is where users collect selected cards. It can hold multiple cards and acts as the combination engine.

### 3. Combinations
When cards are added to the Core, the system analyzes them and generates:
- **Insight**: A name for the combination
- **Synergy**: How the features work together
- **Benefits**: Specific advantages of the combination

## Component Architecture

### FeatureCard Component
- Displays individual financial features
- Shows icon, name, description, and parameters
- Visual feedback when selected
- Click to add/remove from Core

### CoreCard Component
- Compact representation of selected cards
- Shows in the Core panel
- Has remove button for each card

### InsightPanel Component
- Empty state when no cards selected
- Shows combination analysis when cards are in Core
- Displays synergy description and benefits list

## Data Structure

### Modular Card Files
Each card is a separate file in \data/cards/\:

\\\
data/cards/
 budgeting.ts
 investment.ts
 savings.ts
 analytics.ts
 debt.ts
 tax.ts
\\\

**Benefits:**
- Easy to add new cards
- Simple to maintain and update
- Clear separation of concerns
- Can be individually edited without affecting others

### Combination Logic
The \lib/combinations.ts\ file contains:
- Predefined insights for specific combinations
- Generic fallback for unlisted combinations
- Logic to identify card combinations by ID

## User Flow

1. User sees all available feature cards
2. User clicks a card to add it to the Core
3. Core updates with the selected card
4. InsightPanel shows combination analysis
5. User can add more cards to see different insights
6. User can remove cards individually or clear all
7. Insights update in real-time as cards change

## Adding New Features

### Step 1: Create Card Data File

\\\	ypescript
// data/cards/retirement.ts
import type { Card } from '@/types';

export const retirementCard: Card = {
  id: 'retirement',
  name: 'Retirement Planning',
  description: 'Plan for a secure financial future',
  icon: 'Home',
  category: 'Planning',
  parameters: {
    ageTargeting: true,
    savingsProjection: 4,
    scenarioModeling: true,
  },
  color: '#3F51B5',
};
\\\

### Step 2: Export in Index

\\\	ypescript
// data/index.ts
import { retirementCard } from './cards/retirement';

export const allCards = [
  // ... existing cards,
  retirementCard,
];
\\\

### Step 3: Add Combination Insights (Optional)

\\\	ypescript
// lib/combinations.ts
const insights: Record<string, CoreCombination> = {
  'investment-retirement': {
    cards,
    insight: 'Future Security Package',
    benefits: [
      'Long-term wealth building with retirement focus',
      'Strategic asset allocation for retirement goals',
    ],
    synergy: 'Investment strategies optimized for retirement timeline',
  },
  // ... other combinations
};
\\\

## Technology Stack Details

- **Next.js 15**: App Router for modern routing
- **React 19**: Latest hooks and features
- **TypeScript**: Full type safety
- **Mantine UI v7**: Component library with built-in theming
- **Lucide React**: 1000+ icons, tree-shakeable
- **CSS-in-JS**: Mantine's styling solution

## File Organization Best Practices

1. **Separation of Concerns**: UI, data, logic, types all separated
2. **Modularity**: Each card is its own file
3. **Type Safety**: TypeScript interfaces for all data structures
4. **Component Composition**: Small, focused components
5. **Client Components**: Marked with 'use client' where needed

## Future Enhancement Ideas

- Add card filtering by category
- Save favorite combinations
- Share combinations via URL
- Add more card parameters
- Implement card search
- Add animations for card selection
- Create combination presets
- Export insights as PDF

## Development Tips

- Use TypeScript autocomplete for icon names
- Test combinations by ID in browser console
- Add console.log in combinations.ts to debug
- Use React DevTools to inspect component state
- Hot reload works for all file changes
