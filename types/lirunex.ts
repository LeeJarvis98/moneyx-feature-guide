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

// Downline Trading Account Types
export interface LirunexDownlineAccount {
  mt4Id: number;
  email: string;
  onboardingStage: string;
  clientStage: string;
  partnerId: string | number;
}

export interface LirunexDownlineParams {
  mt4Id?: number;
  email?: string;
}

export interface LirunexDownlineResponse {
  success: boolean;
  message: string | null;
  data: LirunexDownlineAccount[];
}
