/**
 * Google Sheets API Utilities
 * 
 * Centralized configuration and utilities for Google Sheets integration.
 * All credentials are loaded from environment variables.
 */

import { google } from 'googleapis';

/**
 * Google Service Account credentials object
 * Loaded from environment variables for security
 */
export function getServiceAccountCredentials() {
  return {
    type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE || 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
    token_uri: process.env.GOOGLE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || 'googleapis.com',
  };
}

/**
 * Creates an authenticated Google Sheets API client
 * @returns Authenticated sheets API instance
 */
export async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getServiceAccountCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Type-safe wrapper for common Google Sheets operations
 */
export class GoogleSheetsService {
  private sheets: ReturnType<typeof google.sheets> | null = null;

  private async getClient() {
    if (!this.sheets) {
      this.sheets = await getGoogleSheetsClient();
    }
    return this.sheets;
  }

  /**
   * Read values from a sheet range
   */
  async getValues(spreadsheetId: string, range: string) {
    const sheets = await this.getClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values || [];
  }

  /**
   * Append values to a sheet
   */
  async appendValues(spreadsheetId: string, range: string, values: any[][]) {
    const sheets = await this.getClient();
    return sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  }

  /**
   * Update values in a sheet
   */
  async updateValues(spreadsheetId: string, range: string, values: any[][]) {
    const sheets = await this.getClient();
    return sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  }

  /**
   * Batch update multiple ranges
   */
  async batchUpdate(spreadsheetId: string, data: Array<{ range: string; values: any[][] }>) {
    const sheets = await this.getClient();
    return sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: data.map(({ range, values }) => ({ range, values })),
      },
    });
  }

  /**
   * Clear a range in a sheet
   */
  async clearRange(spreadsheetId: string, range: string) {
    const sheets = await this.getClient();
    return sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
