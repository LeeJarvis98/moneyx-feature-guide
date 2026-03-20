'use client';

import { useState, useEffect } from 'react';
import { Progress } from '@mantine/core';
import Image from 'next/image';
import PartnerLogin from './PartnerLogin';
import PartnerDashboard from './PartnerDashboard';
import WelcomeScreen from './WelcomeScreen';
import { exnessApi } from '@/lib/exness/api';
import styles from './PartnerApp.module.css';

interface PartnerAppProps {
  onAsideContentChange?: (content: React.ReactNode) => void;
  selectedPlatform: string | null;
  onPlatformSelect: (platform: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  selectedPlatforms?: string[] | null;
}

export default function PartnerApp({ onAsideContentChange, selectedPlatform, onPlatformSelect, isAuthenticated, setIsAuthenticated, selectedPlatforms }: PartnerAppProps) {
  const [checking, setChecking] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPlatform, setCurrentPlatform] = useState<string | null>(null);
  // null = still loading from parent, true/false = loaded
  const hasSelectedPlatforms = selectedPlatforms == null ? null : selectedPlatforms.length > 0;

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoadingProgress(20);
      const token = exnessApi.getToken();
      const partnerId = sessionStorage.getItem('partnerId');
      
      setLoadingProgress(40);
      
      if (token) {
        try {
          // Verify token is valid by making a test request
          await exnessApi.getTokenInfo();
          setIsAuthenticated(true);
          const storedPlatform = sessionStorage.getItem('partnerPlatform');
          if (storedPlatform) setCurrentPlatform(storedPlatform);
          setLoadingProgress(100);
        } catch (error) {
          // Token is invalid, clear it
          exnessApi.clearToken();
          setIsAuthenticated(false);
          setLoadingProgress(100);
        }
      } else {
        setLoadingProgress(100);
      }
      setChecking(false);
    };

    checkAuth();
  }, [setIsAuthenticated]);

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

  const handleLogout = () => {
    exnessApi.clearToken();
    sessionStorage.removeItem('partnerId');
    sessionStorage.removeItem('platformToken');
    sessionStorage.removeItem('partnerPlatform');
    setCurrentPlatform(null);
    setIsAuthenticated(false);
  };

  if (checking || hasSelectedPlatforms === null) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingContent}>
          <Image
            src="/vnclc-logo.png"
            alt="VNCLC Logo"
            width={181}
            height={40}
            priority
            className={styles.loadingLogo}
          />
          
          <div className={styles.loadingText}>
            {hasSelectedPlatforms === null ? 'Đang tải thông tin sàn...' : 'Đang xác thực...'}
          </div>
          
          <div className={styles.progressContainer}>
            <Progress
              value={loadingProgress}
              size="md"
              radius="xl"
              color="rgba(255, 184, 28, 1)"
              animated
              className={styles.progress}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <PartnerDashboard 
          onLogout={handleLogout} 
          onAsideContentChange={onAsideContentChange}
          platform={currentPlatform || selectedPlatform || 'exness'}
          selectedPlatforms={selectedPlatforms ?? undefined}
        />
      ) : !hasSelectedPlatforms ? (
        <WelcomeScreen />
      ) : selectedPlatform ? (
        <PartnerLogin 
          onLoginSuccess={() => setIsAuthenticated(true)} 
          selectedPlatform={selectedPlatform}
          onAsideContentChange={onAsideContentChange}
          selectedPlatforms={selectedPlatforms || []}
        />
      ) : (
        <div className={styles.noPlatformMessage}>
          <h3>Vui lòng chọn một sàn</h3>
          <p>Nhấp vào một sàn trong thanh điều hướng để đăng nhập.</p>
        </div>
      )}
    </>
  );
}
