// Exness API Types
export interface ExnessAuthCredentials {
  login: string;
  password: string;
  captcha_key?: string;
}

export interface ExnessAuthResponse {
  token: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface ExnessApiError {
  error: string;
  message: string;
  status: number;
}

// Partner API Types
export interface PartnerLink {
  reward_schema: string;
  link_code: string;
  is_default: boolean;
  is_blocked: boolean;
  is_custom: boolean;
  partner_account: string;
}

export interface PartnerLinksResponse {
  data: PartnerLink[];
  total: number;
}

export interface SubPublisher {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'blocked';
  created_at: string;
}

export interface TrafficSource {
  uid: string;
  name: string;
  type: string;
  status: 'verified' | 'pending' | 'rejected';
  created_at: string;
}

export interface AffiliationRequest {
  email: string;
}

export interface AffiliationResponse {
  is_affiliated: boolean;
  client_id?: string;
  partner_id?: string;
}

export interface CryptoWalletInfo {
  available: boolean;
  currencies?: string[];
}
