'use client';

import { useState, useEffect } from 'react';
import ChainCommissionBreakdown from './ChainCommissionBreakdown';
import AccountChainFlow from './AccountChainFlow';
import styles from './PartnerSystem.module.css';

interface PartnerSystemProps {
   autoFetch?: boolean;
}

// Helper function to safely format numbers
const formatNumber = (value: any, decimals: number = 2): string => {
   const num = Number(value);
   return isNaN(num) ? '0.00' : num.toFixed(decimals);
};

// Helper function to build proper parent relationships from commission snapshot data
const buildPartnerTree = async (commissionData: any[], currentUserId: string) => {
   if (!Array.isArray(commissionData) || commissionData.length === 0) {
      return [];
   }

   console.log('[PartnerSystem] buildPartnerTree called with currentUserId:', currentUserId);
   console.log('[PartnerSystem] Commission data:', commissionData);

   // Get all partner IDs
   const partnerIds = commissionData.map(row => row.source_partner_id);
   console.log('[PartnerSystem] Partner IDs to fetch:', partnerIds);
   
   // Fetch referral chains for all partners to determine parent relationships
   const parentMap = new Map<string, string>(); // partnerId -> parentId
   
   for (const partnerId of partnerIds) {
      try {
         console.log(`[PartnerSystem] Fetching chain for ${partnerId}...`);
         const response = await fetch(`/api/referral-chain?id=${partnerId}`);
         if (response.ok) {
            const data = await response.json();
            console.log(`[PartnerSystem] Chain data for ${partnerId}:`, data);
            // The direct parent is the one who referred this partner
            if (data.directReferrerId) {
               console.log(`[PartnerSystem] Setting parent of ${partnerId} to ${data.directReferrerId}`);
               parentMap.set(partnerId, data.directReferrerId);
            } else {
               console.log(`[PartnerSystem] No directReferrerId for ${partnerId}, will use fallback`);
            }
         } else {
            console.error(`[PartnerSystem] Failed to fetch chain for ${partnerId}, status:`, response.status);
         }
      } catch (error) {
         console.error(`[PartnerSystem] Error fetching chain for ${partnerId}:`, error);
      }
   }

   console.log('[PartnerSystem] Final parent map:', Object.fromEntries(parentMap));

   // Map commission data with proper parent relationships
   const result = commissionData.map((row: any) => ({
      ...row,
      parentUserId: parentMap.get(row.source_partner_id) || currentUserId,
   }));
   
   console.log('[PartnerSystem] Partner tree result:', result.map((r: any) => ({ id: r.source_partner_id, parent: r.parentUserId })));
   
   return result;
};

export default function PartnerSystem({ autoFetch = true }: PartnerSystemProps) {
   const [partnerData, setPartnerData] = useState<any>(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // Chain commission and referral chain data
   const [chainCommissionRows, setChainCommissionRows] = useState<any[]>([]);
   const [referralChain, setReferralChain] = useState<any>(null);
   const [partnerTree, setPartnerTree] = useState<any[]>([]);

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

         // Fetch chain commission snapshot
         let commissionData: any[] = [];
         try {
            const commissionResponse = await fetch(`/api/chain-commission-snapshot?id=${userId}`);
            if (commissionResponse.ok) {
               commissionData = await commissionResponse.json();
               setChainCommissionRows(commissionData || []);
            }
         } catch (commissionError) {
            console.error('[PartnerSystem] Error fetching chain commission:', commissionError);
         }

         // Fetch referral chain
         try {
            const chainResponse = await fetch(`/api/referral-chain?id=${userId}`);
            if (chainResponse.ok) {
               const chainData = await chainResponse.json();
               setReferralChain(chainData || null);
            }
         } catch (chainError) {
            console.error('[PartnerSystem] Error fetching referral chain:', chainError);
         }

         // Build partner tree from commission snapshot data (like PartnerDashboard does)
         if (commissionData && commissionData.length > 0) {
            const enhancedCommissionData = await buildPartnerTree(commissionData, userId);
            // Map to PartnerTreeNode format for AccountChainFlow
            const tree = enhancedCommissionData.map((row: any) => ({
               id: row.source_partner_id,
               email: row.source_email || '',
               partner_rank: row.source_rank,
               reward_percentage: row.source_total_reward > 0 
                  ? ((row.source_total_reward - row.commission_pool) / row.source_total_reward) * 100
                  : 0,
               total_lots: row.source_total_reward,   // partner's own total reward
               total_reward: row.your_cut,             // current user's commission from this partner
               parentUserId: row.parentUserId || userId,
               depth: row.depth || 1,
            }));
            setPartnerTree(tree);
         }
      } catch (err) {
         const error = err as Error;
         setError(error.message || 'Không thể tải dữ liệu đại lý');
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
                     <h4>Tổng Com Khách (sàn)</h4>
                     <p className={styles.summaryValue}>${partnerData.total_client_reward}</p>
                  </div>
                  <div className={styles.summaryCard}>
                     <h4>Tổng Com Đại lý (Tradi)</h4>
                     <p className={styles.summaryValue}>${partnerData.total_partner_reward}</p>
                  </div>
               </div>
               <div className={styles.summaryCards}>
                  <div className={styles.summaryCard}>
                     <h4>Com Khách tích lũy tháng này</h4>
                     <p className={styles.summaryValue}>${partnerData.accum_client_reward}</p>
                  </div>
                  <div className={styles.summaryCard}>
                     <h4>Com Đại lý tích lũy tháng này</h4>
                     <p className={styles.summaryValue}>${partnerData.accum_partner_reward}</p>
                  </div>
               </div>

               {/* Chain Commission Breakdown */}
               <h3 className={styles.sectionListHeading}>Phân tích Commission Chi tiết</h3>
               <ChainCommissionBreakdown
                  rows={chainCommissionRows}
                  userRewardPercentage={
                     partnerData.user_rank?.reward_percentage
                        ? partnerData.user_rank.reward_percentage * 100
                        : undefined
                  }
                  userTotalReward={partnerData.total_client_reward || undefined}
               />

               {/* Account Chain Flow */}
               <h3 className={styles.sectionListHeadingSpaced}>Sơ đồ Chuỗi Giới thiệu</h3>
               <AccountChainFlow
                  referralChain={referralChain}
                  partnerTree={partnerTree}
                  userId={localStorage.getItem('userId') || sessionStorage.getItem('userId') || ''}
                  userRank={
                     partnerData.user_rank
                        ? {
                           partner_rank: partnerData.user_rank.partner_rank,
                           reward_percentage: partnerData.user_rank.reward_percentage * 100,
                           lot_volume: partnerData.user_rank.lot_volume,
                        }
                        : null
                  }
                  exnessTotals={{
                     volume_lots: partnerData.user_rank?.lot_volume || 0,
                     reward_usd: partnerData.total_client_reward || 0,
                  }}
               />
            </>
         )}
      </div>
   );
}
