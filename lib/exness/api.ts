import type {
  ExnessAuthCredentials,
  ExnessAuthResponse,
  ExnessApiError,
  ClientAccountsReportResponse,
} from '@/types/exness';

// Use Next.js API routes
const API_BASE = '/api/exness';

class ExnessApiClient {
  private token: string | null = null;

  // Store token in memory and localStorage
  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('exness_token', token);
    }
  }

  // Retrieve token from memory or localStorage
  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('exness_token');
    }
    return this.token;
  }

  // Clear token
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('exness_token');
    }
  }

  // Generic fetch wrapper
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const method = options.method || 'GET';

    // For GET requests, use query parameters
    if (method === 'GET') {
      // Build the URL properly to preserve query parameters in endpoint
      const params = new URLSearchParams();
      params.append('endpoint', endpoint); // This properly encodes the endpoint
      if (token) {
        params.append('token', token);
      }
      
      const response = await fetch(`${API_BASE}/partner?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error: ExnessApiError = await response.json().catch(() => ({
          error: 'Unknown Error',
          message: response.statusText,
          status: response.status,
        }));
        throw error;
      }

      return response.json();
    }

    // For POST, PATCH, DELETE requests to partner endpoints
    const response = await fetch(`${API_BASE}/partner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        method,
        token: token || undefined,
        data: options.body ? JSON.parse(options.body as string) : undefined,
      }),
    });

    if (!response.ok) {
      const error: ExnessApiError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: response.statusText,
        status: response.status,
      }));
      throw error;
    }

    return response.json();
  }

  // === AUTH ENDPOINTS ===

  // Login (POST /api/v2/auth/)
  async login(credentials: ExnessAuthCredentials): Promise<ExnessAuthResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error: ExnessApiError = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: response.statusText,
        status: response.status,
      }));
      throw error;
    }

    const data = await response.json();

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  // Get token info (GET /api/v2/auth/token/)
  async getTokenInfo(): Promise<any> {
    return this.request('/api/v2/auth/token/', { method: 'GET' });
  }

  // Logout (DELETE /api/v2/auth/token/)
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
      }
    } finally {
      this.clearToken();
    }
  }

  // === PARTNER ENDPOINTS ===

  // Get client accounts report (GET /api/reports/clients/accounts/)
  async getClientAccountsReport(accountIds?: string[]): Promise<ClientAccountsReportResponse> {
    let endpoint = '/api/reports/clients/accounts/';
    
    // Add client_account filter if provided (using comma-separated values)
    if (accountIds && accountIds.length > 0) {
      const accountsParam = accountIds.join(',');
      endpoint += `?client_account=${accountsParam}`;
      console.log('[EXNESS API CLIENT] Requesting endpoint:', endpoint);
      console.log('[EXNESS API CLIENT] Account IDs:', accountIds);
      console.log('[EXNESS API CLIENT] Account IDs count:', accountIds.length);
    }
    
    return this.request(endpoint, { method: 'GET' });
  }
}

// Export singleton instance
export const exnessApi = new ExnessApiClient();
