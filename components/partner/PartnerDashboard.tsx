'use client';

import { useState, useEffect, useMemo } from 'react';
import { Stack, NavLink, TextInput } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import 'mantine-datatable/styles.layer.css';
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
  const [activeSection, setActiveSection] = useState<'reports' | 'partnerSystem'>('reports');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Client accounts report state
  const [clientAccountsReport, setClientAccountsReport] = useState<ClientAccountsReportResponse | null>(null);
  const [licensedAccountsDetails, setLicensedAccountsDetails] = useState<Array<{email: string; uid: string; accountId: string; platform: string; timestamp: string | null}>>([]);
  
  // Sort and filter state
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'index',
    direction: 'asc',
  });
  const [filterQuery, setFilterQuery] = useState('');

  // Update aside content when data changes
  useEffect(() => {
    if (onAsideContentChange) {
      onAsideContentChange(renderAsideContent());
    }
  }, [activeSection, clientAccountsReport, loading, error]);

  // Auto-fetch report when Client Accounts Report section is selected
  useEffect(() => {
    if (activeSection === 'reports' && !clientAccountsReport && !loading) {
      // Ensure token is available before fetching
      const token = exnessApi.getToken();
      if (token) {
        fetchClientAccountsReport();
      }
    }
  }, [activeSection]);

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
      let accountDetails: Array<{email: string; uid: string; accountId: string; platform: string; timestamp: string | null}> = [];
      if (licensedIdsData.success && licensedIdsData.data) {
        accountIds = licensedIdsData.data;
        // Map API response to ensure platform field exists
        accountDetails = (licensedIdsData.details || []).map((detail: any) => ({
          email: detail.email,
          uid: detail.uid,
          accountId: detail.accountId,
          platform: detail.platform || 'exness',
          timestamp: detail.timestamp,
        }));
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
      console.log('[FETCH CLIENT ACCOUNTS] Totals:', report.totals);
      console.log('[FETCH CLIENT ACCOUNTS] Partner Commission:', report.totals?.partner_commission);
      console.log('[FETCH CLIENT ACCOUNTS] Tradi Commission:', report.totals?.tradi_commission);
      
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

  // Prepare and filter table records
  const tableRecords = useMemo(() => {
    if (!clientAccountsReport) return [];
    
    // Map data to table records
    const records = clientAccountsReport.data.map((account, index) => {
      const details = licensedAccountsDetails.find(
        (d) => d.accountId === account.client_account
      );
      
      return {
        id: account.id,
        index: index + 1,
        client_account: account.client_account,
        email: details?.email || 'N/A',
        platform: details?.platform || 'exness',
        licensed_date: details?.timestamp || 'N/A',
        volume_lots: account.volume_lots,
        reward_usd: account.reward_usd,
      };
    });
    
    // Apply filter
    const filtered = filterQuery
      ? records.filter((record) => {
          const query = filterQuery.toLowerCase();
          return (
            record.client_account.toLowerCase().includes(query) ||
            record.email.toLowerCase().includes(query) ||
            record.licensed_date.toLowerCase().includes(query)
          );
        })
      : records;
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const accessor = sortStatus.columnAccessor as keyof typeof a;
      const aValue = a[accessor];
      const bValue = b[accessor];
      
      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortStatus.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string sorting
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortStatus.direction === 'asc') {
        return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
      } else {
        return aStr < bStr ? 1 : aStr > bStr ? -1 : 0;
      }
    });
    
    return sorted;
  }, [clientAccountsReport, licensedAccountsDetails, sortStatus, filterQuery]);

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
              label="Client"
              active={activeSection === 'reports'}
              fw={activeSection === 'reports' ? 700 : undefined}
              onClick={() => {
                setActiveSection('reports');
                setError(null);
              }}
              color="#FFB81C"
            />
            
            <NavLink
              label="Partner System"
              active={activeSection === 'partnerSystem'}
              fw={activeSection === 'partnerSystem' ? 700 : undefined}
              onClick={() => {
                setActiveSection('partnerSystem');
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
        {/* Client Section */}
        {activeSection === 'reports' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Client</h2>
              <button
                onClick={fetchClientAccountsReport}
                disabled={loading}
                className={styles.fetchButton}
              >
                {loading ? 'Loading...' : 'Refresh'}
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

                {/* Filter Input */}
                <TextInput
                  placeholder="Search by account, email, or date..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.currentTarget.value)}
                  style={{ 
                    marginBottom: '1rem',
                    maxWidth: '400px'
                  }}
                  styles={{
                    input: {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      border: '1px solid rgba(255, 184, 28, 0.3)',
                      '&:focus': {
                        borderColor: '#FFB81C',
                      },
                    },
                  }}
                />

                {/* Client Accounts Table */}
                <DataTable
                  columns={[
                    { 
                      accessor: 'index', 
                      title: '#', 
                      width: 60, 
                      textAlign: 'center',
                      sortable: true
                    },
                    { 
                      accessor: 'client_account', 
                      title: 'Client Account',
                      width: 150,
                      sortable: true
                    },
                    { 
                      accessor: 'email', 
                      title: 'Email',
                      width: 200,
                      sortable: true
                    },
                    { 
                      accessor: 'platform', 
                      title: 'Platform',
                      width: 100,
                      sortable: true,
                      render: (record: any) => {
                        const platform = String(record.platform || 'exness');
                        return platform.charAt(0).toUpperCase() + platform.slice(1);
                      }
                    },
                    { 
                      accessor: 'licensed_date', 
                      title: 'Licensed Date',
                      width: 180,
                      sortable: true
                    },
                    { 
                      accessor: 'volume_lots', 
                      title: 'Volume (Lots)',
                      width: 130,
                      sortable: true,
                      render: (record) => formatNumber(record.volume_lots, 2)
                    },
                    { 
                      accessor: 'reward_usd', 
                      title: 'Reward (USD)',
                      width: 130,
                      sortable: true,
                      render: (record) => `$${formatNumber(record.reward_usd, 2)}`
                    },
                  ]}
                  records={tableRecords}
                  sortStatus={sortStatus}
                  onSortStatusChange={setSortStatus}
                  noRecordsText=""
                  noRecordsIcon={<></>}
                  styles={{
                    header: { 
                      backgroundColor: 'rgba(255, 184, 28, 0.1)',
                    },
                    table: {
                      backgroundColor: 'transparent',
                    }
                  }}
                  highlightOnHover
                />
              </>
            )}
          </div>
        )}

        {/* Partner System Section */}
        {activeSection === 'partnerSystem' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Partner System</h2>
            </div>

            {clientAccountsReport ? (
              <>
                {/* Commission Summary Cards */}
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Total Partner Com.</h4>
                    <p className={styles.summaryValue}>
                      ${formatNumber(clientAccountsReport.totals.partner_commission || 0, 2)}
                    </p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Tradi Com.</h4>
                    <p className={styles.summaryValue}>
                      ${formatNumber(clientAccountsReport.totals.tradi_commission || 0, 2)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Please fetch the Client data first to view commission data.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}