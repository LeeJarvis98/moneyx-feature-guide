'use client';

import { useState, useEffect } from 'react';
import PartnerLogin from './PartnerLogin';
import PartnerDashboard from './PartnerDashboard';
import PartnerNavBar from './PartnerNavBar';
import { exnessApi } from '@/lib/exness/api';
import styles from './PartnerApp.module.css';

interface PartnerAppProps {
  onAsideContentChange?: (content: React.ReactNode) => void;
}

export default function PartnerApp({ onAsideContentChange }: PartnerAppProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = exnessApi.getToken();
      if (token) {
        try {
          // Verify token is valid by making a test request
          await exnessApi.getTokenInfo();
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          exnessApi.clearToken();
          setIsAuthenticated(false);
        }
      }
      setChecking(false);
    };

    checkAuth();
  }, []);

  // Clear aside content when not authenticated
  useEffect(() => {
    if (!isAuthenticated && onAsideContentChange) {
      onAsideContentChange(null);
    }
  }, [isAuthenticated, onAsideContentChange]);

  // Clear aside content when checking completes and user is not authenticated
  useEffect(() => {
    if (!checking && !isAuthenticated && onAsideContentChange) {
      onAsideContentChange(null);
    }
  }, [checking, isAuthenticated, onAsideContentChange]);

  if (checking) {
    return (
      <div className={styles.checkingAuth}>
        Checking authentication...
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <PartnerDashboard 
          onLogout={() => setIsAuthenticated(false)} 
          onAsideContentChange={onAsideContentChange}
        />
      ) : (
        <div className={styles.container}>
          <PartnerNavBar 
            selectedPlatform={selectedPlatform}
            onPlatformSelect={setSelectedPlatform}
          />
          <PartnerLogin 
            onLoginSuccess={() => setIsAuthenticated(true)} 
            selectedPlatform={selectedPlatform}
          />
        </div>
      )}
    </>
  );
}
