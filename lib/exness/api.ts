import type {
  ExnessAuthCredentials,
  ExnessAuthResponse,
  ExnessApiError,
  PartnerLink,
  PartnerLinksResponse,
  AffiliationRequest,
  AffiliationResponse,
  CryptoWalletInfo,
  SubPublisher,
  TrafficSource,
} from '@/types/exness';

// Use our own API proxy to avoid CORS issues
const PROXY_URL = '/api/exness';

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
      
      const response = await fetch(`${PROXY_URL}?${params.toString()}`, {
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

    // For POST, PATCH, DELETE requests
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        endpoint,
        method,
        token: token || undefined,
        data: options.body || undefined,
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
    const response = await this.request<ExnessAuthResponse>('/api/v2/auth/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  // Get token info (GET /api/v2/auth/token/)
  async getTokenInfo(): Promise<any> {
    return this.request('/api/v2/auth/token/', { method: 'GET' });
  }

  // Logout (DELETE /api/v2/auth/token/)
  async logout(): Promise<void> {
    try {
      await this.request('/api/v2/auth/token/', { method: 'DELETE' });
    } finally {
      this.clearToken();
    }
  }

  // Generate CAPTCHA (POST /api/auth/captcha/)
  async generateCaptcha(): Promise<{ key: string; image: string }> {
    return this.request('/api/auth/captcha/', { method: 'POST' });
  }

  // === PARTNER ENDPOINTS ===

  // Check affiliation (POST /api/partner/affiliation/)
  async checkAffiliation(data: AffiliationRequest): Promise<AffiliationResponse> {
    return this.request('/api/partner/affiliation/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get crypto wallet info (GET /api/partner/crypto-wallet/info/)
  async getCryptoWalletInfo(): Promise<CryptoWalletInfo> {
    return this.request('/api/partner/crypto-wallet/info/', { method: 'GET' });
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

  // Get sub-publishers list (GET /api/partner/sub_publisher/list)
  async getSubPublishers(params?: Record<string, string>): Promise<SubPublisher[]> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`/api/partner/sub_publisher/list${queryString}`, { method: 'GET' });
  }

  // Get sub-publishers summary (GET /api/partner/sub_publisher/summary)
  async getSubPublishersSummary(): Promise<any> {
    return this.request('/api/partner/sub_publisher/summary', { method: 'GET' });
  }

  // Block sub-publisher (POST /api/partner/sub_publisher/{sub_id}/block)
  async blockSubPublisher(subId: string): Promise<void> {
    return this.request(`/api/partner/sub_publisher/${subId}/block`, { method: 'POST' });
  }

  // Get traffic sources (GET /api/partner/traffic_sources/)
  async getTrafficSources(): Promise<TrafficSource[]> {
    return this.request('/api/partner/traffic_sources/', { method: 'GET' });
  }

  // Add traffic source (POST /api/partner/traffic_sources/)
  async addTrafficSource(data: any): Promise<TrafficSource> {
    return this.request('/api/partner/traffic_sources/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get traffic source validator (GET /api/partner/traffic_sources/validator/)
  async getTrafficSourceValidator(): Promise<any> {
    return this.request('/api/partner/traffic_sources/validator/', { method: 'GET' });
  }

  // Get specific traffic source (GET /api/partner/traffic_sources/{uid})
  async getTrafficSource(uid: string): Promise<TrafficSource> {
    return this.request(`/api/partner/traffic_sources/${uid}`, { method: 'GET' });
  }

  // Update traffic source (PATCH /api/partner/traffic_sources/{uid})
  async updateTrafficSource(uid: string, data: any): Promise<TrafficSource> {
    return this.request(`/api/partner/traffic_sources/${uid}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete traffic source (DELETE /api/partner/traffic_sources/{uid})
  async deleteTrafficSource(uid: string): Promise<void> {
    return this.request(`/api/partner/traffic_sources/${uid}`, { method: 'DELETE' });
  }

  // Verify traffic source (POST /api/partner/traffic_sources/{uid}/verify)
  async verifyTrafficSource(uid: string): Promise<TrafficSource> {
    return this.request(`/api/partner/traffic_sources/${uid}/verify`, { method: 'POST' });
  }
}

// Export singleton instance
export const exnessApi = new ExnessApiClient();
