export interface Card {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  parameters: {
    [key: string]: string | number | boolean;
  };
  color: string;
}

export interface CoreCombination {
  cards: Card[];
  insight: string;
  benefits: string[];
  synergy: string;
}
