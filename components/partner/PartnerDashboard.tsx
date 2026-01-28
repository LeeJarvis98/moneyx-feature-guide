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
  
  // Partner data state
  const [partnerData, setPartnerData] = useState<any>(null);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  
  // Sort and filter state
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'index',
    direction: 'asc',
  });
  const [filterQuery, setFilterQuery] = useState('');
  
  // Partner list sort and filter state
  const [partnerSortStatus, setPartnerSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'index',
    direction: 'asc',
  });
  const [partnerFilterQuery, setPartnerFilterQuery] = useState('');

  // Update aside content when data changes
  useEffect(() => {
    if (onAsideContentChange) {
      onAsideContentChange(renderAsideContent());
    }
  }, [activeSection, clientAccountsReport, partnerData, loading, partnerLoading, error, partnerError]);

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
  
  // Auto-fetch partner data when Partner System section is selected
  useEffect(() => {
    if (activeSection === 'partnerSystem' && !partnerData && !partnerLoading) {
      fetchPartnerData();
    }
  }, [activeSection]);

  // Fetch partner data
  const fetchPartnerData = async () => {
    setPartnerLoading(true);
    setPartnerError(null);
    
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      if (!userId) {
        setPartnerError('User ID not found. Please login again.');
        setPartnerLoading(false);
        return;
      }
      
      // First, get the partner's platform credentials from Supabase
      const credentialsResponse = await fetch('/api/get-partner-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const credentialsData = await credentialsResponse.json();
      
      if (!credentialsResponse.ok) {
        throw new Error(credentialsData.error || 'Failed to fetch partner credentials');
      }
      
      // Get platform accounts from the response
      const platformAccounts = credentialsData.data?.platform_accounts;
      
      console.log('[REFRESH] Platform accounts:', platformAccounts);
      
      // Call ngrok refresh-account API for each platform
      let hasSuccessfulRefresh = false;
      if (platformAccounts && Array.isArray(platformAccounts) && platformAccounts.length > 0) {
        // Iterate through the array of platform account objects
        for (const accountGroup of platformAccounts) {
          // Each accountGroup is an object with platform names as keys
          const platforms = Object.keys(accountGroup);
          
          for (const platform of platforms) {
            const credentials = accountGroup[platform];
            
            if (credentials && credentials.email && credentials.password) {
              try {
                console.log(`[REFRESH] Calling ngrok API for platform: ${platform}`);
                
                const ngrokResponse = await fetch('/api/refresh-partner-account', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    id: userId,
                    login: credentials.email,
                    password: credentials.password,
                    platform: platform,
                  }),
                });
                
                if (!ngrokResponse.ok) {
                  console.error(`[REFRESH] Ngrok API call failed for ${platform}`);
                  const errorData = await ngrokResponse.json().catch(() => ({}));
                  console.error(`[REFRESH] Error details:`, errorData);
                } else {
                  console.log(`[REFRESH] Ngrok API call successful for ${platform}`);
                  hasSuccessfulRefresh = true;
                }
              } catch (ngrokError) {
                console.error(`[REFRESH] Error calling ngrok API for ${platform}:`, ngrokError);
                // Continue with other platforms
              }
            }
          }
        }
      }
      
      // Only fetch updated partner data if at least one ngrok API call succeeded
      if (!hasSuccessfulRefresh) {
        setPartnerError('Failed to refresh account data from all platforms. Please try again.');
        return;
      }
      
      console.log('[REFRESH] At least one platform refreshed successfully, fetching updated data...');
      
      // Now fetch updated partner data from Supabase
      const response = await fetch('/api/get-partner-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch partner data');
      }
      
      setPartnerData(data.data);
    } catch (err) {
      const error = err as Error;
      setPartnerError(error.message || 'Failed to fetch partner data');
    } finally {
      setPartnerLoading(false);
    }
  };
  
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

  // Prepare partner list table records
  const partnerListRecords = useMemo(() => {
    if (!partnerData || !partnerData.partner_list) return [];
    
    const records = (partnerData.partner_list as any[]).map((partner, index) => ({
      index: index + 1,
      id: partner.id || 'N/A',
      email: partner.email || 'N/A',
      partner_rank: partner.partner_rank || 'N/A',
      partner_type: partner.partner_type || 'N/A',
      total_lots: partner.total_lots || 0,
      total_reward: partner.total_reward || 0,
      refer_reward: partner.refer_reward || 0,
      reward_percentage: partner.reward_percentage || 0,
      refer_percentage: partner.refer_percentage || 0,
    }));
    
    // Apply filter
    const filtered = partnerFilterQuery
      ? records.filter((record) => {
          const query = partnerFilterQuery.toLowerCase();
          return (
            record.id.toLowerCase().includes(query) ||
            record.email.toLowerCase().includes(query) ||
            record.partner_rank.toLowerCase().includes(query) ||
            record.partner_type.toLowerCase().includes(query)
          );
        })
      : records;
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      const accessor = partnerSortStatus.columnAccessor as keyof typeof a;
      const aValue = a[accessor];
      const bValue = b[accessor];
      
      // Handle numeric sorting
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return partnerSortStatus.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // Handle string sorting
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (partnerSortStatus.direction === 'asc') {
        return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
      } else {
        return aStr < bStr ? 1 : aStr > bStr ? -1 : 0;
      }
    });
    
    return sorted;
  }, [partnerData, partnerSortStatus, partnerFilterQuery]);
  
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
              <button
                onClick={fetchPartnerData}
                disabled={partnerLoading}
                className={styles.fetchButton}
              >
                {partnerLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {partnerError && (
              <div className={styles.error} role="alert">
                {partnerError}
              </div>
            )}

            {partnerData && (
              <>
                {/* Overview Cards */}
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Total Clients</h4>
                    <p className={styles.summaryValue}>{partnerData.total_clients}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Partners</h4>
                    <p className={styles.summaryValue}>{partnerData.total_partners}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Partner Type</h4>
                    <p className={styles.summaryValue}>{partnerData.partner_type || 'N/A'}</p>
                  </div>
                </div>

                {/* Client Statistics */}
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.25rem' }}>Client Statistics</h3>
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Total Client Lots</h4>
                    <p className={styles.summaryValue}>{formatNumber(partnerData.total_client_lots, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Client Reward</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.total_client_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Accum Client Reward</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.accum_client_reward, 2)}</p>
                  </div>
                </div>

                {/* Partner Statistics */}
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.25rem' }}>Partner Statistics</h3>
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Total Partner Lots</h4>
                    <p className={styles.summaryValue}>{formatNumber(partnerData.total_partner_lots, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Partner Reward</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.total_partner_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Accum Partner Reward</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.accum_partner_reward, 2)}</p>
                  </div>
                </div>

                {/* Referral & Tradi Statistics */}
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.25rem' }}>Referral & Commission</h3>
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Total Refer Reward</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.total_refer_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Accum Refer Reward</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.accum_refer_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Total Tradi Com.</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.total_tradi_com, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>This Month Tradi Com.</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.this_month_tradi_com, 2)}</p>
                  </div>
                </div>

                {/* Claim Statistics */}
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.25rem' }}>Claim Information</h3>
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Claim Client Reward</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.claim_client_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Claim Partner Reward</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.claim_partner_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Claim Refer Reward</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.claim_refer_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Claim Time Remaining</h4>
                    <p className={styles.summaryValue}>{formatNumber(partnerData.claim_time_remaining, 0)} days</p>
                  </div>
                </div>

                {/* Last Claim Statistics */}
                <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                    <h4>Last Claim Client</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.last_claim_client_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Last Claim Partner</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.last_claim_partner_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Last Claim Refer</h4>
                    <p className={styles.summaryValue}>${formatNumber(partnerData.last_claim_refer_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                    <h4>Accum Time Remaining</h4>
                    <p className={styles.summaryValue}>{formatNumber(partnerData.accum_time_remaining, 0)} days</p>
                  </div>
                </div>

                {/* Partner List Table */}
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.25rem' }}>Partner List</h3>
                
                <TextInput
                  placeholder="Search by ID, email, rank, or type..."
                  value={partnerFilterQuery}
                  onChange={(e) => setPartnerFilterQuery(e.currentTarget.value)}
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
                      accessor: 'id', 
                      title: 'Partner ID',
                      width: 120,
                      sortable: true
                    },
                    { 
                      accessor: 'email', 
                      title: 'Email',
                      width: 200,
                      sortable: true
                    },
                    { 
                      accessor: 'partner_rank', 
                      title: 'Rank',
                      width: 100,
                      sortable: true
                    },
                    { 
                      accessor: 'partner_type', 
                      title: 'Type',
                      width: 80,
                      sortable: true
                    },
                    { 
                      accessor: 'total_lots', 
                      title: 'Total Lots',
                      width: 100,
                      sortable: true,
                      render: (record) => formatNumber(record.total_lots, 2)
                    },
                    { 
                      accessor: 'total_reward', 
                      title: 'Total Reward',
                      width: 120,
                      sortable: true,
                      render: (record) => `$${formatNumber(record.total_reward, 2)}`
                    },
                    { 
                      accessor: 'refer_reward', 
                      title: 'Refer Reward',
                      width: 120,
                      sortable: true,
                      render: (record) => `$${formatNumber(record.refer_reward, 2)}`
                    },
                    { 
                      accessor: 'reward_percentage', 
                      title: 'Reward %',
                      width: 100,
                      sortable: true,
                      render: (record) => `${formatNumber((record.reward_percentage as number) * 100, 1)}%`
                    },
                    { 
                      accessor: 'refer_percentage', 
                      title: 'Refer %',
                      width: 100,
                      sortable: true,
                      render: (record) => `${formatNumber((record.refer_percentage as number) * 100, 1)}%`
                    },
                  ]}
                  records={partnerListRecords}
                  sortStatus={partnerSortStatus}
                  onSortStatusChange={setPartnerSortStatus}
                  noRecordsText="No partners found"
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
      </div>
    </div>
  );
}