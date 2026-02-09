'use client';

import { useState, useEffect } from 'react';
import { Grid } from '@mantine/core';
import styles from './AccumulationHistory.module.css';

interface AccumulationHistoryProps {
  autoFetch?: boolean;
}

interface ClaimRewards {
  accum_client_reward: number;
  accum_partner_reward: number;
  accum_refer_reward: number;
  total_client_reward: number;
  total_partner_reward: number;
  total_refer_reward: number;
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

      const response = await fetch('/api/get-partner-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        setRewards({
          accum_client_reward: data.accum_client_reward || 0,
          accum_partner_reward: data.accum_partner_reward || 0,
          accum_refer_reward: data.accum_refer_reward || 0,
          total_client_reward: data.total_client_reward || 0,
          total_partner_reward: data.total_partner_reward || 0,
          total_refer_reward: data.total_refer_reward || 0,
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
    { title: 'Tổng Com Khách', value: rewards.total_client_reward, color: '#FFB81C' },
    { title: 'Tổng Com Đối Tác', value: rewards.total_partner_reward, color: '#FFC82E' },
    { title: 'Tổng Com Ref.', value: rewards.total_refer_reward, color: '#FFD54F' },
    { title: 'Tích lũy Com Khách tháng này', value: rewards.accum_client_reward, color: '#40c057' },
    { title: 'Tích lũy Com Đối Tác tháng này', value: rewards.accum_partner_reward, color: '#51cf66' },
    { title: 'Tích lũy Com Ref. tháng này', value: rewards.accum_refer_reward, color: '#69db7c' },
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