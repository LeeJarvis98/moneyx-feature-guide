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
            setError('Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.');
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
            throw new Error(credentialsData.error || 'Không thể tải thông tin đối tác');
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
            setError('Không thể làm mới dữ liệu tài khoản từ các nền tảng. Vui lòng thử lại.');
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
            throw new Error(data.error || 'Không thể tải dữ liệu đối tác');
         }

         setPartnerData(data.data);
      } catch (err) {
         const error = err as Error;
         setError(error.message || 'Không thể tải dữ liệu đối tác');
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
            <h2>Hệ thống Đối Tác</h2>
            <button
               onClick={fetchPartnerData}
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

         {partnerData && (
            <>
               <h3 className={styles.sectionHeading}>Tổng Commission & Tích lũy</h3>
               <p className={styles.sectionSubheading}>
                  Hiện đã tích lũy được <strong className={styles.highlightedStrong}>{formatNumber(partnerData.accum_time_remaining, 0)}</strong> ngày, ngày 1 hằng tháng sẽ được làm mới.
               </p>
               <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                     <h4>Tổng Com Khách</h4>
                     <p className={styles.summaryValue}>${formatNumber(partnerData.total_client_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                     <h4>Tổng Com Đối Tác</h4>
                     <p className={styles.summaryValue}>${formatNumber(partnerData.total_partner_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                     <h4>Tổng Com Ref.</h4>
                     <p className={styles.summaryValue}>${formatNumber(partnerData.total_refer_reward, 2)}</p>
                  </div>
               </div>
               <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                     <h4>Com Khách tích lũy tháng này</h4>
                     <p className={styles.summaryValue}>${formatNumber(partnerData.accum_client_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                     <h4>Com Đối Tác tích lũy tháng này</h4>
                     <p className={styles.summaryValue}>${formatNumber(partnerData.accum_partner_reward, 2)}</p>
                  </div>
                  <div className={styles.summaryCard}>
                     <h4>Com Ref. tích lũy tháng này</h4>
                     <p className={styles.summaryValue}>${formatNumber(partnerData.accum_refer_reward, 2)}</p>
                  </div>
               </div>

               {/* Partner List Table */}
               <h3 className={styles.sectionListHeading}>Danh sách Đối Tác ({partnerData.total_partners})</h3>

               <TextInput
                  placeholder="Tìm kiếm theo ID, email, hạng hoặc loại..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.currentTarget.value)}
                  style={{
                     marginBottom: '-10px',
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
                        title: 'ID Đối tác',
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
                        title: 'Hạng',
                        width: 100,
                        sortable: true
                     },
                     {
                        accessor: 'partner_type',
                        title: 'Loại',
                        width: 80,
                        sortable: true
                     },
                     {
                        accessor: 'total_lots',
                        title: 'Tổng lot',
                        width: 100,
                        sortable: true,
                        render: (record) => formatNumber(record.total_lots, 2)
                     },
                     {
                        accessor: 'total_reward',
                        title: 'Tổng thưởng',
                        width: 120,
                        sortable: true,
                        render: (record) => `$${formatNumber(record.total_reward, 2)}`
                     },
                     {
                        accessor: 'refer_reward',
                        title: 'Thưởng Ref.',
                        width: 120,
                        sortable: true,
                        render: (record) => `$${formatNumber(record.refer_reward, 2)}`
                     },
                     {
                        accessor: 'reward_percentage',
                        title: '% Thưởng',
                        width: 100,
                        sortable: true,
                        render: (record) => `${formatNumber((record.reward_percentage as number) * 100, 1)}%`
                     },
                     {
                        accessor: 'refer_percentage',
                        title: '% Ref.',
                        width: 100,
                        sortable: true,
                        render: (record) => `${formatNumber((record.refer_percentage as number) * 100, 1)}%`
                     },
                  ]}
                  records={partnerListRecords}
                  sortStatus={sortStatus}
                  onSortStatusChange={setSortStatus}
                  noRecordsText="Không tìm thấy đối tác"
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
