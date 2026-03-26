import type {
  LirunexAuthCredentials,
  LirunexAuthResponse,
  LirunexApiError,
  LirunexDownlineParams,
  LirunexDownlineResponse,
} from '@/types/lirunex';

// Use Next.js API routes
const API_BASE = '/api/lirunex';

class LirunexApiClient {
  private token: string | null = null;

  // Store token in memory and sessionStorage (clears on tab/window close)
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lirunex_token', token);
    }
  }

  // Retrieve token from memory or sessionStorage
  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = sessionStorage.getItem('lirunex_token');
    }
    return this.token;
  }

  // Clear token
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('lirunex_token');
    }
  }

  // Generic fetch wrapper  routes through Next.js API proxy
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const method = options.method || 'GET';

    if (method === 'GET') {
      const params = new URLSearchParams();
      params.append('endpoint', endpoint);
      if (token) {
        params.append('token', token);
      }

      const response = await fetch(`${API_BASE}/partner?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error: LirunexApiError = await response.json().catch(() => ({
          error: 'Unknown Error',
          message: response.statusText,
          status: response.status,
        }));
        throw error;
      }

      return response.json();
    }

    // POST / PATCH / DELETE
    const response = await fetch(`${API_BASE}/partner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        method,
        token: token || undefined,
        data: options.body ? JSON.parse(options.body as string) : undefined,
      }),
    });

    if (!response.ok) {
      const error: LirunexApiError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: response.statusText,
        status: response.status,
      }));
      throw error;
    }

    return response.json();
  }

  // === AUTH ENDPOINTS ===

  // Login (POST /api/Token)
  async login(credentials: LirunexAuthCredentials): Promise<LirunexAuthResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error: LirunexApiError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: response.statusText,
        status: response.status,
      }));
      throw error;
    }

    const data: LirunexAuthResponse = await response.json();

    if (data.token?.access_token) {
      this.setToken(data.token.access_token);
    }

    return data;
  }

  // Logout — discards the local token (no server-side revocation endpoint)
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      }
    } finally {
      this.clearToken();
    }
  }

  // === PARTNER / NETWORK ENDPOINTS ===

  // Get partner downline trading accounts (GET /api/Contact/GetIntroducingBrokerTradingAccountNetwork)
  async getDownlineTradingAccounts(
    params?: LirunexDownlineParams
  ): Promise<LirunexDownlineResponse> {
    let endpoint = '/api/Contact/GetIntroducingBrokerTradingAccountNetwork';

    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams();
      if (params.mt4Id !== undefined) query.append('mt4Id', String(params.mt4Id));
      if (params.email) query.append('email', params.email);
      const qs = query.toString();
      if (qs) endpoint += `?${qs}`;
    }

    return this.request<LirunexDownlineResponse>(endpoint, { method: 'GET' });
  }
}

// Export singleton instance
export const lirunexApi = new LirunexApiClient();
