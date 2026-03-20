'use client';

import { useState, useEffect } from 'react';
import { Stack, NavLink } from '@mantine/core';
import { exnessApi } from '@/lib/exness/api';
import ClientReports from './ClientReports';
import PartnerSystem from './PartnerSystem';
import PartnerRewardConfig from './PartnerRewardConfig';
import styles from './PartnerDashboard.module.css';

interface PartnerDashboardProps {
  onLogout?: () => void;
  onAsideContentChange?: (content: React.ReactNode) => void;
  platform: string;
}

type ActiveSection = 
  | 'reports' 
  | 'partnerSystem'
  | 'rewardConfig';

export default function PartnerDashboard({ onLogout, onAsideContentChange, platform }: PartnerDashboardProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>('reports');

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
              label="Hệ thống Đại lý"
              active={activeSection === 'partnerSystem'}
              fw={activeSection === 'partnerSystem' ? 700 : undefined}
              onClick={() => setActiveSection('partnerSystem')}
              color="#FFB81C"
            />
            
            <NavLink
              label="Hệ thống Thưởng"
              active={activeSection === 'rewardConfig'}
              fw={activeSection === 'rewardConfig' ? 700 : undefined}
              onClick={() => setActiveSection('rewardConfig')}
              color="grape"
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
        {activeSection === 'reports' && <ClientReports autoFetch={true} platform={platform} />}
        {activeSection === 'partnerSystem' && <PartnerSystem autoFetch={true} platform={platform} />}
        {activeSection === 'rewardConfig' && <PartnerRewardConfig platform={platform} />}
      </div>
    </div>
  );
}
