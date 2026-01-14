// Exness API Types
export interface ExnessAuthCredentials {
  login: string;
  password: string;
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

export interface AffiliationRequest {
  email: string;
}

export interface AffiliationResponse {
  affiliation: boolean;
  accounts: string[];
  client_uid: string;
}

// Client Accounts Report Types
export interface ClientAccount {
  id: number;
  partner_account: string;
  partner_account_name: string;
  partner_account_currency: string;
  partner_code: string;
  client_uid: string;
  client_account: string;
  client_account_type: string;
  client_country: string;
  platform: string;
  client_account_created: string; // ISO date string
  client_account_last_trade: string; // ISO date string
  volume_lots: number;
  volume_mln_usd: number;
  reward: number;
  reward_usd: number;
  comment: string;
}

export interface ClientAccountsReportTotals {
  count: number;
  clients_count: number;
  volume_mln_usd: number;
  volume_lots: number;
  reward: number;
  reward_usd: number;
  partner_account_currency: string[];
}

export interface ClientAccountsReportResponse {
  data: ClientAccount[];
  totals: ClientAccountsReportTotals;
}

// Client Report Types
export interface ClientReportItem {
  partner_account: string;
  client_uid: string;
  reg_date: string;
  client_country: string;
  volume_lots: number;
  volume_mln_usd: number;
  reward_usd: number;
  trade_fn: string;
  client_contact_sharing_status: string;
  client_status: string;
  last_partner_contact_sharing_dt: string;
  comment: string;
  rebate_amount_usd: number;
  kyc_passed: boolean;
  ftd_received: boolean;
  ftt_made: boolean;
  last_client_contact_sharing_dt: string;
  client_balance: number;
  client_equity: number;
}

export interface ClientReportTotals {
  count: number;
  volume_lots: number;
  volume_mln_usd: number;
  reward_usd: number;
  server_dt: string;
  available_for_request: number;
}

export interface ClientReportResponse {
  data: ClientReportItem[];
  totals: ClientReportTotals;
}
