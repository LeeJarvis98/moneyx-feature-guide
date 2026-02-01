'use client';

import { useState, useEffect } from 'react';
import { Grid } from '@mantine/core';
import styles from './AccumulationHistory.module.css';

interface AccumulationHistoryProps {
  autoFetch?: boolean;
}

interface ClaimRewards {
  last_claim_client_reward: number;
  last_claim_partner_reward: number;
  last_claim_refer_reward: number;
  claim_client_reward: number;
  claim_partner_reward: number;
  claim_refer_reward: number;
}

export default function AccumulationHistory({ autoFetch = false }: AccumulationHistoryProps) {
  const [loading, setLoading] = useState(false);
  const [rewards, setRewards] = useState<ClaimRewards | null>(null);

  useEffect(() => {
    if (autoFetch) {
      fetchClaimRewards();
    }
  }, [autoFetch]);

  const fetchClaimRewards = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
      if (!userId) {
        console.error('No user ID found');
        return;
      }

      const response = await fetch('/api/check-partner-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setRewards({
          last_claim_client_reward: data.last_claim_client_reward || 0,
          last_claim_partner_reward: data.last_claim_partner_reward || 0,
          last_claim_refer_reward: data.last_claim_refer_reward || 0,
          claim_client_reward: data.claim_client_reward || 0,
          claim_partner_reward: data.claim_partner_reward || 0,
          claim_refer_reward: data.claim_refer_reward || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching claim rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const rewardCards = rewards ? [
    { title: 'Last Claim Client Reward', value: rewards.last_claim_client_reward, color: '#FFB81C' },
    { title: 'Last Claim Partner Reward', value: rewards.last_claim_partner_reward, color: '#FFC82E' },
    { title: 'Last Claim Refer Reward', value: rewards.last_claim_refer_reward, color: '#FFD54F' },
    { title: 'Claim Client Reward', value: rewards.claim_client_reward, color: '#40c057' },
    { title: 'Claim Partner Reward', value: rewards.claim_partner_reward, color: '#51cf66' },
    { title: 'Claim Refer Reward', value: rewards.claim_refer_reward, color: '#69db7c' },
  ] : [];

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Lịch sử tích lũy</h2>
      </div>

      {loading ? (
        <div className={styles.loading}>Đang tải...</div>
      ) : !rewards ? (
        <div className={styles.error}>Chưa có dữ liệu lịch sử tích lũy</div>
      ) : (
        <Grid gutter="md">
          {rewardCards.map((card, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 6, md: 4 }}>
              <div className={styles.rewardCard}>
                <div className={styles.cardTitle}>{card.title}</div>
                <div className={styles.cardValue} data-color={card.color}>
                  {formatCurrency(card.value)}
                </div>
              </div>
            </Grid.Col>
          ))}
        </Grid>
      )}
    </div>
  );
}