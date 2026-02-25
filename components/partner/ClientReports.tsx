'use client';

import { useState, useEffect, useMemo } from 'react';
import { TextInput } from '@mantine/core';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import 'mantine-datatable/styles.layer.css';
import { exnessApi } from '@/lib/exness/api';
import type {
  ExnessApiError,
  ClientAccountsReportResponse,
} from '@/types/exness';
import styles from './ClientReports.module.css';

interface ClientReportsProps {
  autoFetch?: boolean;
}

// Helper function to safely format numbers
const formatNumber = (value: any, decimals: number = 2): string => {
  const num = Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

export default function ClientReports({ autoFetch = true }: ClientReportsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientAccountsReport, setClientAccountsReport] = useState<ClientAccountsReportResponse | null>(null);
  const [licensedAccountsDetails, setLicensedAccountsDetails] = useState<Array<{email: string; uid: string; accountId: string; platform: string; timestamp: string | null}>>([]);
  
  // Sort and filter state
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: 'index',
    direction: 'asc',
  });
  const [filterQuery, setFilterQuery] = useState('');

  // Auto-fetch report on mount if enabled
  useEffect(() => {
    if (autoFetch && !clientAccountsReport && !loading) {
      const token = exnessApi.getToken();
      if (token) {
        fetchClientAccountsReport();
      }
    }
  }, [autoFetch]);

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
        setError('Không tìm thấy tài khoản được cấp phép. Vui lòng cấp phép trước khi tải báo cáo.');
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
      setError(error.message || 'Không thể tải báo cáo tài khoản khách hàng');
    } finally {
      setLoading(false);
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

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Khách hàng</h2>
        <button
          onClick={fetchClientAccountsReport}
          disabled={loading}
          className={styles.fetchButton}
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {clientAccountsReport && (
        <>
          {/* Summary Cards */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <h4>Tổng số khách hàng</h4>
              <p className={styles.summaryValue}>{clientAccountsReport.totals.clients_count || 0}</p>
            </div>
            <div className={styles.summaryCard}>
              <h4>Khối lượng (Lot)</h4>
              <p className={styles.summaryValue}>{formatNumber(clientAccountsReport.totals.volume_lots, 2)}</p>
            </div>
            <div className={styles.summaryCard}>
              <h4>Tổng thưởng (USD)</h4>
              <p className={styles.summaryValue}>${formatNumber(clientAccountsReport.totals.reward_usd, 2)}</p>
            </div>
          </div>

          <h3 className={styles.sectionListHeading}>Danh sách tài khoản ({clientAccountsReport.totals.count})</h3>

          {/* Filter Input */}
          <TextInput
            placeholder="Tìm kiếm theo tài khoản, email hoặc ngày..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.currentTarget.value)}
            className={styles.filterInput}
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
                title: 'Tài khoản khách hàng',
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
                title: 'Nền tảng',
                width: 100,
                sortable: true,
                render: (record: any) => {
                  const platform = String(record.platform || 'exness');
                  return platform.charAt(0).toUpperCase() + platform.slice(1);
                }
              },
              { 
                accessor: 'licensed_date', 
                title: 'Ngày cấp bản quyền',
                width: 180,
                sortable: true
              },
              { 
                accessor: 'volume_lots', 
                title: 'Khối lượng (Lot)',
                width: 130,
                sortable: true,
                render: (record) => formatNumber(record.volume_lots, 2)
              },
              { 
                accessor: 'reward_usd', 
                title: 'Thưởng (USD)',
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
  );
}
