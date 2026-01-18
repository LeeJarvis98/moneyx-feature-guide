/**
 * Application Configuration
 * 
 * All sensitive data (API keys, sheet IDs, credentials) should be stored in .env.local
 * This file exports typed configuration objects for use throughout the application
 */

export interface AppConfig {
  id: string;
  name: string;
  detailedSheetId: string; // Google Sheet ID for detailed data tracking
  sheetTabName: string; // Tab name within the detailed sheet
  ngrokApiUrl: string; // NGROK URL for API lookups
  active: boolean;
}

// Google Sheets IDs from environment variables
export const SHARED_SHEET_ID = process.env.SHARED_SHEET_ID || '';
export const USER_SHEET_ID = process.env.USER_SHEET_ID || '';
export const PARTNER_SHEET_ID = process.env.PARTNER_SHEET_ID || '';

// Main application configuration
export const MAIN_CONFIG: AppConfig = {
  id: 'main',
  name: 'Main Site',
  detailedSheetId: process.env.DETAILED_SHEET_ID || '',
  sheetTabName: process.env.DETAILED_SHEET_TAB || 'AndyBao',
  ngrokApiUrl: process.env.NGROK_API_URL || '',
  active: true,
};

/**
 * Validates that all required environment variables are present
 * @throws Error if any required environment variable is missing
 */
export function validateEnvConfig(): void {
  const required = [
    'GOOGLE_PROJECT_ID',
    'GOOGLE_PRIVATE_KEY',
    'GOOGLE_CLIENT_EMAIL',
    'USER_SHEET_ID',
    'PARTNER_SHEET_ID',
    'SHARED_SHEET_ID',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }
}

