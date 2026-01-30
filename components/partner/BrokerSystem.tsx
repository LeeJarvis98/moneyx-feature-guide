'use client';

import { useState, useEffect } from 'react';
import { Paper, Grid, Card, Text, LoadingOverlay, Button, Group } from '@mantine/core';
import styles from './BrokerSystem.module.css';

interface BrokerSystemProps {
  autoFetch?: boolean;
}

interface BrokerStats {
  totalClients: number;
  activeClients: number;
  totalVolume: number;
  totalCommission: number;
}

export default function BrokerSystem({ autoFetch = false }: BrokerSystemProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<BrokerStats>({
    totalClients: 0,
    activeClients: 0,
    totalVolume: 0,
    totalCommission: 0
  });

  useEffect(() => {
    if (autoFetch) {
      fetchBrokerStats();
    }
  }, [autoFetch]);

  const fetchBrokerStats = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      setStats({
        totalClients: 156,
        activeClients: 98,
        totalVolume: 45000000,
        totalCommission: 3500000
      });
    } catch (error) {
      console.error('Error fetching broker stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className={styles.container}>
      <Paper className={styles.paper} pos="relative">
        <LoadingOverlay visible={loading} />
        
        <div className={styles.header}>
          <h2 className={styles.title}>Broker System</h2>
          <Button 
            onClick={fetchBrokerStats}
            variant="light"
            color="yellow"
            size="sm"
          >
            Làm mới
          </Button>
        </div>

        <Grid gutter="md" className={styles.grid}>
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card className={styles.statCard}>
              <Text size="sm" c="dimmed">Tổng số Client</Text>
              <Text size="xl" fw={700} className={styles.statValue}>
                {stats.totalClients}
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card className={styles.statCard}>
              <Text size="sm" c="dimmed">Client hoạt động</Text>
              <Text size="xl" fw={700} className={styles.statValue}>
                {stats.activeClients}
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card className={styles.statCard}>
              <Text size="sm" c="dimmed">Khối lượng giao dịch</Text>
              <Text size="lg" fw={700} className={styles.statValue}>
                {formatCurrency(stats.totalVolume)}
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card className={styles.statCard}>
              <Text size="sm" c="dimmed">Tổng hoa hồng</Text>
              <Text size="lg" fw={700} className={styles.statValueHighlight}>
                {formatCurrency(stats.totalCommission)}
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        <div className={styles.info}>
          <Text size="sm" c="dimmed">
            Thông tin broker được cập nhật theo thời gian thực từ hệ thống Exness
          </Text>
        </div>
      </Paper>
    </div>
  );
}