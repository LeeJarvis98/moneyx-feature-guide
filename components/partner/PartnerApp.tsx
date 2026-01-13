'use client';

import { useState, useEffect } from 'react';
import PartnerLogin from './PartnerLogin';
import PartnerDashboard from './PartnerDashboard';
import { exnessApi } from '@/lib/exness/api';
import styles from './PartnerApp.module.css';

export default function PartnerApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

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
        <PartnerDashboard onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <PartnerLogin onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </>
  );
}
