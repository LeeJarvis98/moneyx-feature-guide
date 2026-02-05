/**
 * Application Configuration
 * 
 * All sensitive data (API keys, credentials) should be stored in .env.local
 * This file exports typed configuration objects for use throughout the application
 */

export interface AppConfig {
  id: string;
  name: string;
  ngrokApiUrl: string; // NGROK URL for API lookups
  active: boolean;
}

// Main application configuration
export const MAIN_CONFIG: AppConfig = {
  id: 'main',
  name: 'Main Site',
  ngrokApiUrl: process.env.NGROK_API_URL || '',
  active: true,
};

/**
 * Validates that all required environment variables are present
 * @throws Error if any required environment variable is missing
 */
export function validateEnvConfig(): void {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }
}

