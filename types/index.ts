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

// Network snapshot node (from network_snapshots table)
export interface NetworkSnapshotNode {
  id: string;
  snapshot_id: string;
  owner_id: string;
  platform: string;
  snapshotted_at: string;
  node_key: string;
  role: 'You' | 'Upline' | 'Direct Partner' | 'Indirect Partner';
  role_color: string;
  user_id: string;
  email: string | null;
  depth: number;
  parent_user_id: string | null;
  total_lots: number;
  total_reward_usd: number;
}

// Platform types for partner data
export interface PlatformRefLinks {
  [platform: string]: string;
}

export interface PlatformAccountCredentials {
  email: string;
  password: string;
}

export interface PlatformAccounts {
  [platform: string]: PlatformAccountCredentials;
}
