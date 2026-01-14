/**
 * Partner Configuration Hub
 * 
 * Centralized configuration for all partners with their specific settings.
 * Each partner has their own:
 * - Google Sheet ID (for detailed tracking)
 * - Sheet tab name (within the detailed sheet)
 * - NGROK API URL (for account lookups)
 * 
 * The shared Google Sheet (SHARED_SHEET_ID) is used by all partners.
 */

export interface PartnerConfig {
  id: string; // URL-friendly identifier (e.g., "mra", "johncena")
  name: string; // Display name
  detailedSheetId: string; // Google Sheet ID for this partner's data
  sheetTabName: string; // Tab name within the detailed sheet
  ngrokApiUrl: string; // Partner-specific NGROK URL
  active: boolean; // Whether this partner is active
}

// Shared Google Sheet used by all partners (including main site)
export const SHARED_SHEET_ID = '10pyG095zn4Kb2yIXHqI4-INzlUpyvqFcEiwh1qgtwgI';

// Main site configuration (used when no partner route is specified)
export const MAIN_CONFIG: PartnerConfig = {
  id: 'main',
  name: 'Main Site',
  detailedSheetId: '1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8',
  sheetTabName: 'AndyBao',
  ngrokApiUrl: 'https://rainbowy-clarine-presumingly.ngrok-free.dev/api/lookup',
  active: true,
};

// Partner configurations
export const PARTNERS: Record<string, PartnerConfig> = {
  chung: {
    id: 'chung',
    name: 'Chung',
    detailedSheetId: '1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8',
    sheetTabName: 'Chung',
    ngrokApiUrl: 'https://chung.ngrok.app/api/lookup',
    active: true,
  },
  johncena: {
    id: 'johncena',
    name: 'John Cena',
    detailedSheetId: '1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8',
    sheetTabName: 'JohnCena',
    ngrokApiUrl: 'https://johncena-partner.ngrok-free.dev/api/lookup',
    active: true,
  },
  // Add more partners here as needed
  // example: {
  //   id: 'example',
  //   name: 'Example Partner',
  //   detailedSheetId: '1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8',
  //   sheetTabName: 'ExamplePartner',
  //   ngrokApiUrl: 'https://example-partner.ngrok-free.dev/api/lookup',
  //   active: true,
  // },
};

/**
 * Get partner configuration by ID
 * @param partnerId - The partner ID from the URL (e.g., "mra", "johncena")
 * @returns Partner configuration or null if not found/inactive
 */
export function getPartnerConfig(partnerId?: string | null): PartnerConfig | null {
  // If no partner ID provided, return main config
  if (!partnerId) {
    return MAIN_CONFIG;
  }

  // Normalize the ID (lowercase, trim)
  const normalizedId = partnerId.toLowerCase().trim();

  // Check if partner exists and is active
  const partner = PARTNERS[normalizedId];
  if (partner && partner.active) {
    return partner;
  }

  return null;
}

/**
 * Get all active partners
 * @returns Array of active partner configurations
 */
export function getActivePartners(): PartnerConfig[] {
  return Object.values(PARTNERS).filter(p => p.active);
}

/**
 * Check if a partner ID is valid and active
 * @param partnerId - The partner ID to validate
 * @returns True if partner exists and is active
 */
export function isValidPartner(partnerId: string): boolean {
  const normalizedId = partnerId.toLowerCase().trim();
  const partner = PARTNERS[normalizedId];
  return partner !== undefined && partner.active;
}
