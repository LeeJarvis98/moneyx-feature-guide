/**
 * Application Configuration
 * 
 * Centralized configuration for the application with settings for:
 * - Google Sheet ID (for detailed tracking)
 * - Sheet tab name (within the detailed sheet)
 * - NGROK API URL (for account lookups)
 */

export interface AppConfig {
  id: string;
  name: string;
  detailedSheetId: string; // Google Sheet ID for detailed data tracking
  sheetTabName: string; // Tab name within the detailed sheet
  ngrokApiUrl: string; // NGROK URL for API lookups
  active: boolean;
}

// Shared Google Sheet used for simple license tracking (column B only)
export const SHARED_SHEET_ID = '10pyG095zn4Kb2yIXHqI4-INzlUpyvqFcEiwh1qgtwgI';

// Main application configuration
export const MAIN_CONFIG: AppConfig = {
  id: 'main',
  name: 'Main Site',
  detailedSheetId: '1RvbrLkn8vFYUIq4zC9W8dhR_Q38cmVUtqNzWhLMBBy8',
  sheetTabName: 'AndyBao',
  ngrokApiUrl: 'https://rainbowy-clarine-presumingly.ngrok-free.dev/api/lookup',
  active: true,
};
