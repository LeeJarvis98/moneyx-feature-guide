'use client';

import { useState, useEffect } from 'react';
import ChainCommissionBreakdown from './ChainCommissionBreakdown';
import AccountChainFlow from './AccountChainFlow';
import type { NetworkSnapshotNode } from '@/types';
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
   const [networkNodes, setNetworkNodes] = useState<NetworkSnapshotNode[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Auto-fetch on mount if enabled
   useEffect(() => {
      if (autoFetch && !partnerData && !loading) {
         fetchData();
      }
   }, [autoFetch]);

   const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
         const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

         if (!userId) {
            setError('Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.');
            setLoading(false);
            return;
         }

         // Fetch partner summary and network snapshot in parallel
         const [partnerResponse, networkResponse] = await Promise.all([
            fetch('/api/get-partner-data', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ userId }),
            }),
            fetch(`/api/network-snapshot?owner_id=${encodeURIComponent(userId)}&platform=exness`),
         ]);

         const partnerJson = await partnerResponse.json();
         if (!partnerResponse.ok) {
            throw new Error(partnerJson.error || 'Không thể tải dữ liệu đối tác');
         }
         setPartnerData(partnerJson.data);

         if (networkResponse.ok) {
            const networkJson: NetworkSnapshotNode[] = await networkResponse.json();
            setNetworkNodes(networkJson);
         } else {
            console.warn('[PartnerSystem] Network snapshot not available');
         }
      } catch (err) {
         const e = err as Error;
         setError(e.message || 'Không thể tải dữ liệu đại lý');
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className={styles.section}>
         <div className={styles.sectionHeader}>
            <h2>Hệ thống Đại lý</h2>
            <span className={styles.updateNotice}>Dữ liệu sẽ được cập nhật vào 0h mỗi ngày</span>
         </div>

         {/* Loading Display */}
         {loading && (
            <div className={styles.loading}>Đang tải...</div>
         )}

         {/* Error Display */}
         {error && (
            <div className={styles.error} role="alert">
               {error}
            </div>
         )}

         {partnerData && (
            <>
               <h3 className={styles.sectionHeading}>Tổng Commission</h3>
               <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                     <h4>Tổng Com Khách (sàn)</h4>
                     <p className={styles.summaryValue}>${partnerData.total_client_reward}</p>
                  </div>
                  <div className={styles.summaryCard}>
                     <h4>Tổng Com Đại lý (Tradi)</h4>
                     <p className={styles.summaryValue}>${partnerData.total_partner_reward}</p>
                  </div>
               </div>

                           {/* Chain Commission Breakdown */}
               <h3 className={styles.sectionListHeading}>Phân tích Commission Chi tiết</h3>
               <ChainCommissionBreakdown
                  nodes={networkNodes}
               />

               {/* Account Chain Flow */}
               <h3 className={styles.sectionListHeadingSpaced}>Sơ đồ Đại lý</h3>
               <AccountChainFlow
                  nodes={networkNodes}
               />
            </>
         )}
      </div>
   );
}
