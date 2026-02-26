'use client';

import { useState, useEffect } from 'react';
import { Stack, NavLink } from '@mantine/core';
import { exnessApi } from '@/lib/exness/api';
import ClientReports from './ClientReports';
import PartnerSystem from './PartnerSystem';
import AccumulationHistory from './AccumulationHistory';
import styles from './PartnerDashboard.module.css';

interface PartnerDashboardProps {
  onLogout?: () => void;
  onAsideContentChange?: (content: React.ReactNode) => void;
}

type ActiveSection = 
  | 'reports' 
  | 'partnerSystem' 
  | 'accumulationHistory';

export default function PartnerDashboard({ onLogout, onAsideContentChange }: PartnerDashboardProps) {
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
              label="Lịch sử tích lũy"
              active={activeSection === 'accumulationHistory'}
              fw={activeSection === 'accumulationHistory' ? 700 : undefined}
              onClick={() => setActiveSection('accumulationHistory')}
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
      </div>
    </div>
  );
}
