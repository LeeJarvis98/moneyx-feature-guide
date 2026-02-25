'use client';

import { useMemo, useState } from 'react';
import { Stack, SimpleGrid, Paper, Text, Badge, Select } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import styles from './ChainCommissionBreakdown.module.css';

interface ChainCommissionRow {
  recipient_id: string;
  source_partner_id: string;
  source_email: string | null;
  source_rank: string;
  depth: number;
  chain_root_id: string | null;
  source_total_reward: number;
  commission_pool: number;
  tradi_fee: number;
  remaining_pool: number;
  your_role: 'admin' | 'direct' | 'indirect';
  your_cut: number;
  total_upliner_count: number;
  upliner_share: number;
  own_keep: number;
  snapshot_at: string;
}

interface ChainCommissionBreakdownProps {
  rows: ChainCommissionRow[];
  userRewardPercentage?: number;
  userTotalReward?: number;
}

export default function ChainCommissionBreakdown({
  rows,
  userRewardPercentage,
  userTotalReward,
}: ChainCommissionBreakdownProps) {
  const [selectedChainRoot, setSelectedChainRoot] = useState<string | null>('all');

  // Get unique chain roots for filter
  const chainRoots = useMemo(() => {
    const roots = new Set<string>();
    rows.forEach((row) => {
      if (row.depth === 1 && row.source_partner_id) {
        roots.add(row.source_partner_id);
      }
    });
    return Array.from(roots);
  }, [rows]);

  // Filter rows based on selected chain root
  const filteredRows = useMemo(() => {
    if (selectedChainRoot === 'all') return rows;
    return rows.filter(
      (row) =>
        row.source_partner_id === selectedChainRoot ||
        row.chain_root_id === selectedChainRoot
    );
  }, [rows, selectedChainRoot]);

  // Calculate summary values
  const summary = useMemo(() => {
    const ownKeep = filteredRows.length > 0 ? filteredRows[0].own_keep : 0;
    const totalFromChain = filteredRows.reduce((sum, row) => sum + row.your_cut, 0);
    const activePartners = new Set(filteredRows.map((row) => row.source_partner_id)).size;

    return {
      ownKeep,
      totalFromChain,
      totalEstimated: ownKeep + totalFromChain,
      activePartners,
    };
  }, [filteredRows]);

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'direct':
        return 'yellow';
      case 'indirect':
        return 'grape';
      case 'admin':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <div className={styles.container}>
      <Stack gap="lg">
        {/* Summary Cards */}
        <SimpleGrid cols={3} spacing="md">
          <Paper p="md" withBorder className={styles.summaryCard}>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                Own Keep
              </Text>
              <Text size="xl" fw={700} c="blue">
                ${summary.ownKeep.toFixed(4)}
              </Text>
              <Text size="xs" c="dimmed">
                {userRewardPercentage && userTotalReward
                  ? `${userRewardPercentage}% of your $${userTotalReward.toFixed(2)} reward`
                  : 'Your earned reward'}
              </Text>
            </Stack>
          </Paper>

          <Paper p="md" withBorder className={styles.summaryCard}>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                 From Chain
              </Text>
              <Text size="xl" fw={700} c="orange">
                ${summary.totalFromChain.toFixed(4)}
              </Text>
              <Text size="xs" c="dimmed">
                From {summary.activePartners} active partner{summary.activePartners !== 1 ? 's' : ''}
              </Text>
            </Stack>
          </Paper>

          <Paper p="md" withBorder className={styles.summaryCard}>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                Total Estimated
              </Text>
              <Text size="xl" fw={700} c="green">
                ${summary.totalEstimated.toFixed(4)}
              </Text>
              <Text size="xs" c="dimmed">
                Own keep + chain commission
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* Filter */}
        {chainRoots.length > 1 && (
          <Select
            label="Filter by Direct Partner"
            placeholder="Select a direct partner"
            data={[
              { value: 'all', label: 'All Partners' },
              ...chainRoots.map((rootId) => {
                const row = rows.find((r) => r.source_partner_id === rootId);
                return {
                  value: rootId,
                  label: row?.source_email || rootId,
                };
              }),
            ]}
            value={selectedChainRoot}
            onChange={(value) => setSelectedChainRoot(value)}
            clearable={false}
          />
        )}

        {/* Commission Table */}
        <Paper withBorder>
          <DataTable
            striped
            highlightOnHover
            withTableBorder={false}
            records={filteredRows}
            columns={[
              {
                accessor: 'source_email',
                title: 'Partner',
                render: (row) => (
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {row.source_email || 'N/A'}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {row.source_partner_id}
                    </Text>
                  </Stack>
                ),
              },
              {
                accessor: 'source_rank',
                title: 'Rank',
                render: (row) => (
                  <Badge variant="light" color="violet" size="sm">
                    {row.source_rank}
                  </Badge>
                ),
              },
              {
                accessor: 'your_role',
                title: 'Your Role',
                render: (row) => (
                  <Badge variant="dot" color={getRoleBadgeColor(row.your_role)} size="sm">
                    {row.your_role}
                  </Badge>
                ),
              },
              {
                accessor: 'source_total_reward',
                title: 'Their Reward',
                render: (row) => <Text size="sm">${row.source_total_reward.toFixed(4)}</Text>,
              },
              {
                accessor: 'commission_pool',
                title: 'Commission Pool',
                render: (row) => (
                  <Stack gap={2}>
                    <Text size="sm">${row.commission_pool.toFixed(4)}</Text>
                    <Text size="xs" c="dimmed">
                      {((row.commission_pool / row.source_total_reward) * 100).toFixed(1)}% upline share
                    </Text>
                  </Stack>
                ),
              },
              {
                accessor: 'tradi_fee',
                title: 'Tradi Fee (5%)',
                render: (row) => (
                  <Text size="sm" c="dimmed">
                    ${row.tradi_fee.toFixed(4)}
                  </Text>
                ),
              },
              {
                accessor: 'remaining_pool',
                title: 'Remaining Pool',
                render: (row) => (
                  <Text size="sm" c="orange" fw={600}>
                    ${row.remaining_pool.toFixed(4)}
                  </Text>
                ),
              },
              {
                accessor: 'total_upliner_count',
                title: 'Total Upline Partners',
                render: (row) => <Text size="sm">{row.total_upliner_count}</Text>,
              },
              {
                accessor: 'upliner_share',
                title: 'Upline Share',
                render: (row) => (
                  <Text size="sm" c="teal">
                    {row.total_upliner_count === 0 ? '' : `$${row.upliner_share.toFixed(4)}`}
                  </Text>
                ),
              },
              {
                accessor: 'your_cut',
                title: 'Your Commission',
                render: (row) => (
                  <Text size="sm" fw={700} c="blue">
                    ${row.your_cut.toFixed(4)}
                  </Text>
                ),
              },
            ]}
            noRecordsText="No commission data available"
          />
        </Paper>
      </Stack>
    </div>
  );
}
