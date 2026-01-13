'use client';

import { useState, useEffect } from 'react';
import { NavLink, Stack } from '@mantine/core';
import { Link, UserCheck, FileText } from 'lucide-react';
import { exnessApi } from '@/lib/exness/api';
import type {
  ExnessApiError,
  PartnerLink,
  AffiliationResponse,
  ClientAccountsReportResponse,
} from '@/types/exness';
import styles from './PartnerDashboard.module.css';

interface PartnerDashboardProps {
  onLogout?: () => void;
  onAsideContentChange?: (content: React.ReactNode) => void;
}

// Helper function for consistent date formatting
const formatDate = (dateString: string): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  
  // Use ISO date format for consistency (YYYY-MM-DD)
  return date.toISOString().split('T')[0];
};

// Helper function to safely format numbers
const formatNumber = (value: any, decimals: number = 2): string => {
  const num = Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

export default function PartnerDashboard({ onLogout, onAsideContentChange }: PartnerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'links' | 'affiliation' | 'reports'>('links');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Links state
  const [partnerLinks, setPartnerLinks] = useState<PartnerLink[]>([]);
  const [defaultLink, setDefaultLink] = useState<PartnerLink | null>(null);

  // Affiliation check state
  const [affiliationEmail, setAffiliationEmail] = useState('');
  const [affiliationResult, setAffiliationResult] = useState<AffiliationResponse | null>(null);

  // Client accounts report state
  const [clientAccountsReport, setClientAccountsReport] = useState<ClientAccountsReportResponse | null>(null);

  // Update aside content when tab or data changes
  useEffect(() => {
    if (onAsideContentChange) {
      onAsideContentChange(renderAsideContent());
    }
  }, [activeTab, partnerLinks, defaultLink, affiliationResult, clientAccountsReport, loading, error, affiliationEmail]);

  // Fetch partner links
  const fetchPartnerLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await exnessApi.getPartnerLinks();
      setPartnerLinks(response.data);
      const defaultLink = response.data.find(link => link.is_default) || null;
      setDefaultLink(defaultLink);
    } catch (err) {
      const error = err as ExnessApiError;
      setError(error.message || 'Failed to fetch partner links');
    } finally {
      setLoading(false);
    }
  };

  // Check client affiliation
  const checkAffiliation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAffiliationResult(null);
    try {
      const result = await exnessApi.checkAffiliation({ email: affiliationEmail });
      setAffiliationResult(result);
    } catch (err) {
      const error = err as ExnessApiError;
      setError(error.message || 'Failed to check affiliation');
    } finally {
      setLoading(false);
    }
  };

  // Fetch client accounts report
  const fetchClientAccountsReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const report = await exnessApi.getClientAccountsReport();
      setClientAccountsReport(report);
    } catch (err) {
      const error = err as ExnessApiError;
      setError(error.message || 'Failed to fetch client accounts report');
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await exnessApi.logout();
      // Call parent callback to return to login screen
      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      console.error('Logout error:', err);
      // Still call logout callback even if API call fails
      if (onLogout) {
        onLogout();
      }
    }
  };

  // Render aside content with navigation buttons
  const renderAsideContent = () => {
    return (
      <Stack gap="xs" style={{ height: '100%' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Partner Options
        </h2>
        
        <NavLink
          label="Partner Links"
          leftSection={<Link size={16} color="#307fffff" />}
          active={activeTab === 'links'}
          fw={activeTab === 'links' ? 700 : undefined}
          onClick={() => setActiveTab('links')}
          color="blue"
        />
        
        <NavLink
          label="Check Affiliation"
          leftSection={<UserCheck size={16} color="#307fffff" />}
          active={activeTab === 'affiliation'}
          fw={activeTab === 'affiliation' ? 700 : undefined}
          onClick={() => setActiveTab('affiliation')}
          color="blue"
        />
        
        <NavLink
          label="Client Accounts Report"
          leftSection={<FileText size={16} color="#307fffff" />}
          active={activeTab === 'reports'}
          fw={activeTab === 'reports' ? 700 : undefined}
          onClick={() => setActiveTab('reports')}
          color="blue"
        />
      </Stack>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Partner Dashboard</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className={styles.content}>
        {/* Partner Links Tab */}
        {activeTab === 'links' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Your Partner Links</h2>
              <button
                onClick={fetchPartnerLinks}
                disabled={loading}
                className={styles.fetchButton}
              >
                {loading ? 'Loading...' : 'Fetch Links'}
              </button>
            </div>

            {defaultLink && (
              <div className={styles.defaultLink}>
                <h3>Default Link</h3>
                <div className={styles.linkItem}>
                  <span className={styles.linkName}>{defaultLink.link_code}</span>
                  <span className={styles.linkUrl}>
                    Partner Account: {defaultLink.partner_account}
                  </span>
                  <span className={styles.linkDate}>
                    Schema: {defaultLink.reward_schema}
                  </span>
                </div>
              </div>
            )}

            {partnerLinks.length > 0 && (
              <div className={styles.linksList}>
                <h3>All Links ({partnerLinks.length})</h3>
                {partnerLinks.map((link, index) => (
                  <div key={index} className={styles.linkItem}>
                    <span className={styles.linkName}>
                      {link.link_code}
                      {link.is_default && ' (Default)'}
                      {link.is_blocked && ' (Blocked)'}
                      {link.is_custom && ' (Custom)'}
                    </span>
                    <span className={styles.linkUrl}>
                      Account: {link.partner_account}
                    </span>
                    <span className={styles.linkDate}>
                      Schema: {link.reward_schema}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Affiliation Check Tab */}
        {activeTab === 'affiliation' && (
          <div className={styles.section}>
            <h2>Check Client Affiliation</h2>
            <form onSubmit={checkAffiliation} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="affiliationEmail">Client Email</label>
                <input
                  type="email"
                  id="affiliationEmail"
                  value={affiliationEmail}
                  onChange={(e) => setAffiliationEmail(e.target.value)}
                  required
                  placeholder="client@example.com"
                  className={styles.input}
                  disabled={loading}
                />
              </div>
              <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? 'Checking...' : 'Check Affiliation'}
              </button>
            </form>

            {affiliationResult && (
              <div className={` ${affiliationResult.affiliation ? styles.affiliated : styles.notAffiliated}`}>
                <h3>
                  {affiliationResult.affiliation ? 'Client is Affiliated' : 'Client is Not Affiliated'}
                </h3>
                {affiliationResult.client_uid && (
                  <p>Client UID: {affiliationResult.client_uid}</p>
                )}
                {affiliationResult.accounts.length > 0 && (
                  <div>
                    <p>Accounts:</p>
                    <ul>
                      {affiliationResult.accounts.map((account, index) => (
                        <li key={index}>{account}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Client Accounts Report Tab */}
        {activeTab === 'reports' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Client Accounts Report</h2>
              <button
                onClick={fetchClientAccountsReport}
                disabled={loading}
                className={styles.fetchButton}
              >
                {loading ? 'Loading...' : 'Fetch Report'}
              </button>
            </div>

            {clientAccountsReport && (
              <>
                {/* Summary Cards */}
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Total Accounts</h4>
                    <p className={styles.summaryValue}>{clientAccountsReport.totals.count}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Clients</h4>
                    <p className={styles.summaryValue}>{clientAccountsReport.totals.clients_count}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Volume (Lots)</h4>
                    <p className={styles.summaryValue}>{formatNumber(clientAccountsReport.totals.volume_lots, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Volume (MLN USD)</h4>
                    <p className={styles.summaryValue}>${formatNumber(clientAccountsReport.totals.volume_mln_usd, 2)}M</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Reward</h4>
                    <p className={styles.summaryValue}>{formatNumber(clientAccountsReport.totals.reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Reward (USD)</h4>
                    <p className={styles.summaryValue}>${formatNumber(clientAccountsReport.totals.reward_usd, 2)}</p>
                  </div>
                </div>

                {/* Client Accounts Table */}
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Client UID</th>
                        <th>Client Account</th>
                        <th>Account Type</th>
                        <th>Country</th>
                        <th>Platform</th>
                        <th>Created</th>
                        <th>Last Trade</th>
                        <th>Volume (Lots)</th>
                        <th>Volume (MLN USD)</th>
                        <th>Reward</th>
                        <th>Reward (USD)</th>
                        <th>Partner Account</th>
                        <th>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAccountsReport.data.map((account) => (
                        <tr key={account.id}>
                          <td>{account.id}</td>
                          <td>{account.client_uid}</td>
                          <td>{account.client_account}</td>
                          <td>{account.client_account_type}</td>
                          <td>{account.client_country}</td>
                          <td>{account.platform}</td>
                          <td suppressHydrationWarning>{formatDate(account.client_account_created)}</td>
                          <td suppressHydrationWarning>{formatDate(account.client_account_last_trade)}</td>
                          <td>{formatNumber(account.volume_lots, 2)}</td>
                          <td>${formatNumber(account.volume_mln_usd, 4)}M</td>
                          <td>{formatNumber(account.reward, 2)}</td>
                          <td>${formatNumber(account.reward_usd, 2)}</td>
                          <td>{account.partner_account}</td>
                          <td>{account.comment || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
