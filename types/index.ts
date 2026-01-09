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

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  category: 'Breaking' | 'Market' | 'Technology' | 'Economy' | 'ESG' | 'Fintech';
  publishDate: string;
  readTime: string;
  views: number;
  image: string;
  articlePath: string;
}
