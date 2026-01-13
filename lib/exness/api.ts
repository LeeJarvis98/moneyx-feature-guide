import type {
  ExnessAuthCredentials,
  ExnessAuthResponse,
  ExnessApiError,
  PartnerLink,
  PartnerLinksResponse,
  AffiliationRequest,
  AffiliationResponse,
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
      const params = new URLSearchParams({
        endpoint,
        ...(token && { token }),
      });
      
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

  // Check affiliation (POST /api/partner/affiliation/)
  async checkAffiliation(data: AffiliationRequest): Promise<AffiliationResponse> {
    return this.request('/api/partner/affiliation/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get default link (GET /api/partner/default_link/)
  async getDefaultLink(): Promise<PartnerLink | null> {
    const response = await this.getPartnerLinks();
    return response.data.find(link => link.is_default) || null;
  }

  // Get all partner links (GET /api/partner/links/)
  async getPartnerLinks(): Promise<PartnerLinksResponse> {
    return this.request('/api/partner/links/', { method: 'GET' });
  }

  // Get client accounts report (GET /api/reports/clients/accounts/)
  async getClientAccountsReport(): Promise<ClientAccountsReportResponse> {
    return this.request('/api/reports/clients/accounts/', { method: 'GET' });
  }
}

// Export singleton instance
export const exnessApi = new ExnessApiClient();
