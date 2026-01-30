'use client';

import { useState, useEffect } from 'react';
import { Table, Paper, Text, LoadingOverlay } from '@mantine/core';
import styles from './AccumulationHistory.module.css';

interface AccumulationHistoryProps {
  autoFetch?: boolean;
}

interface AccumulationRecord {
  id: string;
  date: string;
  amount: number;
  type: string;
  status: string;
  description: string;
}

export default function AccumulationHistory({ autoFetch = false }: AccumulationHistoryProps) {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<AccumulationRecord[]>([]);

  useEffect(() => {
    if (autoFetch) {
      fetchAccumulationHistory();
    }
  }, [autoFetch]);

  const fetchAccumulationHistory = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for demonstration
      const mockData: AccumulationRecord[] = [
        {
          id: '1',
          date: '2026-01-30',
          amount: 1500000,
          type: 'Commission',
          status: 'Completed',
          description: 'Monthly commission'
        },
        {
          id: '2',
          date: '2026-01-25',
          amount: 500000,
          type: 'Bonus',
          status: 'Completed',
          description: 'Performance bonus'
        }
      ];
      setRecords(mockData);
    } catch (error) {
      console.error('Error fetching accumulation history:', error);
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
          <h2 className={styles.title}>Lịch sử tích lũy</h2>
        </div>

        {records.length === 0 && !loading ? (
          <Text c="dimmed" ta="center" py="xl">
            Chưa có dữ liệu lịch sử tích lũy
          </Text>
        ) : (
          <Table className={styles.table} striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ngày</Table.Th>
                <Table.Th>Loại</Table.Th>
                <Table.Th>Số tiền</Table.Th>
                <Table.Th>Trạng thái</Table.Th>
                <Table.Th>Mô tả</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {records.map((record) => (
                <Table.Tr key={record.id}>
                  <Table.Td>{new Date(record.date).toLocaleDateString('vi-VN')}</Table.Td>
                  <Table.Td>{record.type}</Table.Td>
                  <Table.Td className={styles.amount}>{formatCurrency(record.amount)}</Table.Td>
                  <Table.Td>
                    <span className={`${styles.status} ${styles[record.status.toLowerCase()]}`}>
                      {record.status}
                    </span>
                  </Table.Td>
                  <Table.Td>{record.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </div>
  );
}