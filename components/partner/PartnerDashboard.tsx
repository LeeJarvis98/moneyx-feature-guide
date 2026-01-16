'use client';

import { useState, useEffect } from 'react';
import { Stack, NavLink } from '@mantine/core';
import { exnessApi } from '@/lib/exness/api';
import type {
  ExnessApiError,
  ClientAccountsReportResponse,
} from '@/types/exness';
import styles from './PartnerDashboard.module.css';

interface PartnerDashboardProps {
  onLogout?: () => void;
  onAsideContentChange?: (content: React.ReactNode) => void;
}

// Helper function to safely format numbers
const formatNumber = (value: any, decimals: number = 2): string => {
  const num = Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

export default function PartnerDashboard({ onLogout, onAsideContentChange }: PartnerDashboardProps) {
  const [activeSection, setActiveSection] = useState<'reports' | 'commissions'>('reports');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client accounts report state
  const [clientAccountsReport, setClientAccountsReport] = useState<ClientAccountsReportResponse | null>(null);
  const [licensedAccountsDetails, setLicensedAccountsDetails] = useState<Array<{email: string; uid: string; accountId: string; timestamp: string | null}>>([]);
  const [tradiCommissionPercentage, setTradiCommissionPercentage] = useState<number>(10); // Default 10%

  // Update aside content when data changes
  useEffect(() => {
    if (onAsideContentChange) {
      onAsideContentChange(renderAsideContent());
    }
  }, [activeSection, clientAccountsReport, loading, error]);

  // Fetch client accounts report
  const fetchClientAccountsReport = async () => {
    setLoading(true);
    setError(null);
    setClientAccountsReport(null);
    
    try {
      // Fetch all licensed account IDs from backend
      const licensedIdsResponse = await fetch('/api/get-licensed-ids');
      const licensedIdsData = await licensedIdsResponse.json();
      
      let accountIds: string[] = [];
      let accountDetails: Array<{email: string; uid: string; accountId: string; timestamp: string | null}> = [];
      if (licensedIdsData.success && licensedIdsData.data) {
        accountIds = licensedIdsData.data;
        accountDetails = licensedIdsData.details || [];
      }
      
      // Check if there are any licensed accounts
      if (accountIds.length === 0) {
        setError('No licensed accounts found. Please grant licenses first before fetching reports.');
        setLoading(false);
        return;
      }
      
      console.log('[FETCH CLIENT ACCOUNTS] Fetching report for account IDs:', accountIds);
      
      // Fetch report with licensed account IDs as filter
      const report = await exnessApi.getClientAccountsReport(accountIds);
      
      console.log('[FETCH CLIENT ACCOUNTS] Received report:', report);
      console.log('[FETCH CLIENT ACCOUNTS] Number of accounts in response:', report.data?.length || 0);
      
      setClientAccountsReport(report);
      setLicensedAccountsDetails(accountDetails);
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

  // Render aside content
  const renderAsideContent = () => {
    return (
      <Stack gap="xs" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Partner Dashboard
          </h2>
          
          <Stack gap="xs" style={{ marginTop: '16px' }}>
            <NavLink
              label="Client Accounts Report"
              active={activeSection === 'reports'}
              fw={activeSection === 'reports' ? 700 : undefined}
              onClick={() => {
                setActiveSection('reports');
                setError(null);
              }}
              color="#FFB81C"
            />
            
            <NavLink
              label="Commissions"
              active={activeSection === 'commissions'}
              fw={activeSection === 'commissions' ? 700 : undefined}
              onClick={() => {
                setActiveSection('commissions');
                setError(null);
              }}
              color="#FFB81C"
            />
          </Stack>
        </div>
        
        <button 
          onClick={handleLogout} 
          className={styles.logoutButton}
          style={{ marginTop: 'auto', width: '100%' }}
        >
          Logout
        </button>
      </Stack>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Partner Dashboard</h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className={styles.content}>
        {/* Client Accounts Report Section */}
        {activeSection === 'reports' && (
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
                    <h4>Volume (Lots)</h4>
                    <p className={styles.summaryValue}>{formatNumber(clientAccountsReport.totals.volume_lots, 2)}</p>
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
                        <th className={styles.orderColumn} />
                        <th>Client Account</th>
                        <th>Email</th>
                        <th>Licensed Date</th>
                        <th>Volume (Lots)</th>
                        <th>Reward (USD)</th>
                        <th>Partner Com.</th>
                        <th>Tradi Com.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientAccountsReport.data.map((account, index) => {
                        // Find matching licensed account details
                        const details = licensedAccountsDetails.find(
                          (d) => d.accountId === account.client_account
                        );
                        // Calculate commissions
                        const tradiCom = account.reward_usd * (tradiCommissionPercentage / 100);
                        const partnerCom = account.reward_usd - tradiCom;
                        
                        // Extract only the date part from timestamp (remove time)
                        const licensedDate = details?.timestamp ? details.timestamp.split(' ')[0] : 'N/A';
                        
                        return (
                          <tr key={account.id}>
                            <td className={styles.orderColumn}>{index + 1}</td>
                            <td>{account.client_account}</td>
                            <td>{details?.email || 'N/A'}</td>
                            <td>{licensedDate}</td>
                            <td>{formatNumber(account.volume_lots, 2)}</td>
                            <td>${formatNumber(account.reward_usd, 2)}</td>
                            <td>${formatNumber(partnerCom, 2)}</td>
                            <td>${formatNumber(tradiCom, 2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Commissions Section */}
        {activeSection === 'commissions' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Commissions</h2>
            </div>

            {clientAccountsReport ? (
              <>
                {/* Commission Summary Cards */}
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Total Partner Com.</h4>
                    <p className={styles.summaryValue}>
                      ${formatNumber(
                        clientAccountsReport.data.reduce((sum, account) => {
                          const tradiCom = account.reward_usd * (tradiCommissionPercentage / 100);
                          return sum + (account.reward_usd - tradiCom);
                        }, 0), 2
                      )}
                    </p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Tradi Com.</h4>
                    <p className={styles.summaryValue}>
                      ${formatNumber(
                        clientAccountsReport.data.reduce((sum, account) => 
                          sum + (account.reward_usd * (tradiCommissionPercentage / 100)), 0
                        ), 2
                      )}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Please fetch the Client Accounts Report first to view commission data.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}