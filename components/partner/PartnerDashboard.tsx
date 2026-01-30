'use client';

import { useState, useEffect } from 'react';
import { Stack, NavLink } from '@mantine/core';
import { exnessApi } from '@/lib/exness/api';
import ClientReports from './ClientReports';
import PartnerSystem from './PartnerSystem';
import styles from './PartnerDashboard.module.css';

interface PartnerDashboardProps {
  onLogout?: () => void;
  onAsideContentChange?: (content: React.ReactNode) => void;
}

export default function PartnerDashboard({ onLogout, onAsideContentChange }: PartnerDashboardProps) {
  const [activeSection, setActiveSection] = useState<'reports' | 'partnerSystem'>('reports');

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
              onClick={() => setActiveSection('reports')}
              color="#FFB81C"
            />
            
            <NavLink
              label="Partner System"
              active={activeSection === 'partnerSystem'}
              fw={activeSection === 'partnerSystem' ? 700 : undefined}
              onClick={() => setActiveSection('partnerSystem')}
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

      {/* Main Content Area */}
      <div className={styles.content}>
        {activeSection === 'reports' && <ClientReports autoFetch={true} />}
        {activeSection === 'partnerSystem' && <PartnerSystem autoFetch={true} />}
      </div>
    </div>
  );
}
