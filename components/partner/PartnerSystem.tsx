'use client';

import { useState, useEffect, useMemo } from 'react';
import { TextInput } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import 'mantine-datatable/styles.layer.css';
import styles from './PartnerSystem.module.css';

interface PartnerSystemProps {
  autoFetch?: boolean;
}

// Helper function to safely format numbers
const formatNumber = (value: any, decimals: number = 2): string => {
  const num = Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

export default function PartnerSystem({ autoFetch = true }: PartnerSystemProps) {
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Partner list sort and filter state
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'index',
    direction: 'asc',
  });
  const [filterQuery, setFilterQuery] = useState('');

  // Auto-fetch partner data on mount if enabled
  useEffect(() => {
    if (autoFetch && !partnerData && !loading) {
      fetchPartnerData();
    }
  }, [autoFetch]);

  // Fetch partner data
  const fetchPartnerData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      
      if (!userId) {
        setError('User ID not found. Please login again.');
        setLoading(false);
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
        setError('Failed to refresh account data from all platforms. Please try again.');
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
      setError(error.message || 'Failed to fetch partner data');
    } finally {
      setLoading(false);
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
    const filtered = filterQuery
      ? records.filter((record) => {
          const query = filterQuery.toLowerCase();
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
  }, [partnerData, sortStatus, filterQuery]);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Partner System</h2>
        <button
          onClick={fetchPartnerData}
          disabled={loading}
          className={styles.fetchButton}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error} role="alert">
          {error}
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
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
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
  );
}
