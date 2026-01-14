import { NextRequest } from 'next/server';
import { getPartnerConfig, MAIN_CONFIG } from './config';
import type { PartnerConfig } from './config';

/**
 * Extract partner configuration from the request headers
 * The partner ID is passed via a custom header 'x-partner-id' from the client
 */
export function getPartnerFromRequest(request: NextRequest): PartnerConfig {
  // Get partner ID from custom header
  const partnerId = request.headers.get('x-partner-id');
  
  // Get partner config or fallback to main config
  const config = getPartnerConfig(partnerId);
  
  return config || MAIN_CONFIG;
}

/**
 * Get partner configuration from partner ID string
 * Fallback to main config if no match
 */
export function getPartnerConfigOrMain(partnerId?: string | null): PartnerConfig {
  const config = getPartnerConfig(partnerId);
  return config || MAIN_CONFIG;
}
