'use client';

import { useState, useEffect } from 'react';
import { Stack, NavLink, Loader, Text } from '@mantine/core';
import { exnessApi } from '@/lib/exness/api';
import ClientReports from './ClientReports';
import PartnerSystem from './PartnerSystem';
import AccumulationHistory from './AccumulationHistory';
import AccountChainFlow from './AccountChainFlow';
import ChainCommissionBreakdown from './ChainCommissionBreakdown';
import styles from './PartnerDashboard.module.css';

interface PartnerDashboardProps {
  onLogout?: () => void;
  onAsideContentChange?: (content: React.ReactNode) => void;
}

type ActiveSection = 
  | 'reports' 
  | 'partnerSystem' 
  | 'accumulationHistory' 
  | 'chainFlow' 
  | 'commissionBreakdown';

// Helper function to build proper parent relationships
async function buildPartnerTree(commissionData: any[], currentUserId: string) {
  if (!Array.isArray(commissionData) || commissionData.length === 0) {
    return [];
  }

  console.log('[PartnerDashboard] buildPartnerTree called with currentUserId:', currentUserId);
  console.log('[PartnerDashboard] Commission data:', commissionData);

  // Get all partner IDs
  const partnerIds = commissionData.map(row => row.source_partner_id);
  console.log('[PartnerDashboard] Partner IDs to fetch:', partnerIds);
  
  // Fetch referral chains for all partners to determine parent relationships
  const parentMap = new Map<string, string>(); // partnerId -> parentId
  
  for (const partnerId of partnerIds) {
    try {
      console.log(`[PartnerDashboard] Fetching chain for ${partnerId}...`);
      const response = await fetch(`/api/referral-chain?id=${partnerId}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[PartnerDashboard] Chain data for ${partnerId}:`, data);
        // The direct parent is the one who referred this partner
        if (data.directReferrerId) {
          console.log(`[PartnerDashboard] Setting parent of ${partnerId} to ${data.directReferrerId}`);
          parentMap.set(partnerId, data.directReferrerId);
        } else {
          console.log(`[PartnerDashboard] No directReferrerId for ${partnerId}, will use fallback`);
        }
      } else {
        console.error(`[PartnerDashboard] Failed to fetch chain for ${partnerId}, status:`, response.status);
      }
    } catch (error) {
      console.error(`[PartnerDashboard] Error fetching chain for ${partnerId}:`, error);
    }
  }

  console.log('[PartnerDashboard] Final parent map:', Object.fromEntries(parentMap));

  // Map commission data with proper parent relationships
  const result = commissionData.map(row => ({
    ...row,
    parentUserId: parentMap.get(row.source_partner_id) || currentUserId,
  }));
  
  console.log('[PartnerDashboard] Partner tree result:', result.map(r => ({ id: r.source_partner_id, parent: r.parentUserId })));
  
  return result;
}

export default function PartnerDashboard({ onLogout, onAsideContentChange }: PartnerDashboardProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('reports');
  const [chainData, setChainData] = useState<any>(null);
  const [commissionData, setCommissionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID from session storage or API
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('partnerId');
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  // Fetch chain and commission data when needed
  useEffect(() => {
    if (!userId) return;
    
    if (activeSection === 'chainFlow' || activeSection === 'commissionBreakdown') {
      fetchChainData();
    }
  }, [activeSection, userId]);

  const fetchChainData = async () => {
    if (!userId) return;
    
    console.log('[PartnerDashboard] Fetching chain data for userId:', userId);
    setLoading(true);
    try {
      // Fetch referral chain
      console.log('[PartnerDashboard] Calling /api/referral-chain...');
      const chainStart = Date.now();
      const chainResponse = await fetch(`/api/referral-chain?id=${userId}`);
      console.log(`[PartnerDashboard] Chain API responded in ${Date.now() - chainStart}ms, status:`, chainResponse.status);
      
      if (chainResponse.ok) {
        const chainResult = await chainResponse.json();
        console.log('[PartnerDashboard] Chain result:', chainResult);
        setChainData(chainResult);
      } else {
        const errorData = await chainResponse.json();
        console.error('[PartnerDashboard] Chain API error:', chainResponse.status, errorData);
      }

      // Fetch commission snapshot
      console.log('[PartnerDashboard] Calling /api/chain-commission-snapshot...');
      const commissionStart = Date.now();
      const commissionResponse = await fetch(`/api/chain-commission-snapshot?id=${userId}`);
      console.log(`[PartnerDashboard] Commission API responded in ${Date.now() - commissionStart}ms, status:`, commissionResponse.status);
      
      if (commissionResponse.ok) {
        const commissionResult = await commissionResponse.json();
        console.log('[PartnerDashboard] Commission result:', commissionResult);
        
        // Build proper parent relationships by fetching each partner's referral info
        const partnersWithParents = await buildPartnerTree(commissionResult, userId);
        console.log('[PartnerDashboard] Partners with parents:', partnersWithParents);
        setCommissionData(partnersWithParents);
      } else {
        const errorData = await commissionResponse.json();
        console.error('[PartnerDashboard] Commission API error:', commissionResponse.status, errorData);
      }
    } catch (error) {
      console.error('[PartnerDashboard] Error fetching chain data:', error);
    } finally {
      setLoading(false);
      console.log('[PartnerDashboard] Fetch complete');
    }
  };

  // Update aside content when active section changes
  useEffect(() => {
    if (onAsideContentChange) {
      onAsideContentChange(renderAsideContent());
    }
  }, [activeSection]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await exnessApi.logout();
      if (onLogout) {
        onLogout();
      }
    } catch (err) {
      console.error('Logout error:', err);
      if (onLogout) {
        onLogout();
      }
    }
  };

  // Render aside content
  const renderAsideContent = () => {
    return (
      <Stack gap="xs" className={styles.dashboardStack}>
        <div className={styles.dashboardFlex}>
          <h2 className={styles.dashboardHeading}>
            Partner Dashboard
          </h2>
          
          <Stack gap="xs" className={styles.dashboardNavStack}>
            <NavLink
              label="Khách hàng"
              active={activeSection === 'reports'}
              fw={activeSection === 'reports' ? 700 : undefined}
              onClick={() => setActiveSection('reports')}
              color="#FFB81C"
            />
            
            <NavLink
              label="Hệ thống đối tác"
              active={activeSection === 'partnerSystem'}
              fw={activeSection === 'partnerSystem' ? 700 : undefined}
              onClick={() => setActiveSection('partnerSystem')}
              color="#FFB81C"
            />
            
            <NavLink
              label="Lịch sử tích lũy"
              active={activeSection === 'accumulationHistory'}
              fw={activeSection === 'accumulationHistory' ? 700 : undefined}
              onClick={() => setActiveSection('accumulationHistory')}
              color="#FFB81C"
            />

            <NavLink
              label="Sơ đồ chuỗi"
              active={activeSection === 'chainFlow'}
              fw={activeSection === 'chainFlow' ? 700 : undefined}
              onClick={() => setActiveSection('chainFlow')}
              color="#FFB81C"
            />

            <NavLink
              label="Chi tiết hoa hồng"
              active={activeSection === 'commissionBreakdown'}
              fw={activeSection === 'commissionBreakdown' ? 700 : undefined}
              onClick={() => setActiveSection('commissionBreakdown')}
              color="#FFB81C"
            />
          </Stack>
        </div>
        
        <button 
          onClick={handleLogout} 
          className={`${styles.logoutButton} ${styles.logoutButtonWrapper}`}
        >
          Logout
        </button>
      </Stack>
    );
  };

  return (
    <div className={styles.container}>
      {/* Main Content Area */}
      <div className={styles.content}>
        {activeSection === 'reports' && <ClientReports autoFetch={true} />}
        {activeSection === 'partnerSystem' && <PartnerSystem autoFetch={true} />}
        {activeSection === 'accumulationHistory' && <AccumulationHistory autoFetch={true} />}
        {activeSection === 'chainFlow' && (
          loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <Loader size="lg" />
            </div>
          ) : chainData ? (
            <AccountChainFlow
              referralChain={chainData}
              partnerTree={commissionData.map(row => ({
                id: row.source_partner_id,
                email: row.source_email || '',
                partner_rank: row.source_rank,
                reward_percentage: row.source_total_reward > 0 
                  ? ((row.source_total_reward - row.commission_pool) / row.source_total_reward) * 100
                  : 0,
                total_lots: 0,
                total_reward: row.source_total_reward,
                parentUserId: row.parentUserId || userId || '', // Use fetched parent from buildPartnerTree
                depth: row.depth,
              }))}
              userId={userId || ''}
              userRank={null}
              exnessTotals={{ volume_lots: 0, reward_usd: 0 }}
            />
          ) : (
            <Text>No chain data available</Text>
          )
        )}
        {activeSection === 'commissionBreakdown' && (
          loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <Loader size="lg" />
            </div>
          ) : (
            <ChainCommissionBreakdown
              rows={commissionData}
              userRewardPercentage={commissionData[0]?.own_keep ? 
                (commissionData[0].own_keep / commissionData[0].source_total_reward) * 100 : undefined}
              userTotalReward={commissionData[0]?.source_total_reward}
            />
          )
        )}
      </div>
    </div>
  );
}
