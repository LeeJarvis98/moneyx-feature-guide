// Lirunex API Types

export interface LirunexAuthCredentials {
  username: string;
  password: string;
}

export interface LirunexTokenObject {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: string;
  refresh_expires_in: string;
  token_generated_date: string;
}

export interface LirunexAuthResponse {
  token: LirunexTokenObject;
  roles: number[];
  memberTypeId: number;
  userId: number;
}

export interface LirunexApiError {
  error: string;
  message: string;
  status: number;
}

// Rebate Earned Types
export interface LirunexRebateItem {
  clientMt4Id: number;
  clientEmail: string;
  settledRebate: number;
  settledLotSize: number;
}

export interface LirunexRebateEarnedParams {
  mt4Id?: number;
  email?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
}

export interface LirunexRebateEarnedResponse {
  success: boolean;
  message: string | null;
  data: LirunexRebateItem[];
}
