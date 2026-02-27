'use client';

import { useMemo, useRef, useState } from 'react';
import { Stack, SimpleGrid, Paper, Text, Badge, Select } from '@mantine/core';
import { DataTable, useDataTableColumns, type DataTableColumn } from 'mantine-datatable';
import styles from './ChainCommissionBreakdown.module.css';

const PAGE_SIZES = [5, 10, 20, 50];
const STORE_KEY = 'chain-commission-breakdown-v1';

// Display number as-is from DB, only strip JS float noise (e.g. 245.23600000000002 → 245.236)
const fmt = (n: number) => parseFloat(n.toPrecision(10)).toString();

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
  total_chain_commission: number;
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

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

  // Filter rows based on selected chain root — indirect partners included for calculations
  const filteredRows = useMemo(() => {
    if (selectedChainRoot === 'all') return rows;
    return rows.filter(
      (row) =>
        row.source_partner_id === selectedChainRoot ||
        row.chain_root_id === selectedChainRoot
    );
  }, [rows, selectedChainRoot]);

  // Table-visible rows: indirect partners are hidden from display only
  const visibleRows = useMemo(
    () => filteredRows.filter((row) => row.your_role !== 'indirect'),
    [filteredRows]
  );

  // Reset to first page when filter changes
  const handleChainRootChange = (value: string | null) => {
    setSelectedChainRoot(value);
    setPage(1);
  };

  // Paginated records — derived from visibleRows so indirect stay hidden in the table
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return visibleRows.slice(start, start + pageSize);
  }, [visibleRows, page, pageSize]);

  // Calculate summary values
  const summary = useMemo(() => {
    const ownKeep = filteredRows.length > 0 ? filteredRows[0].own_keep : 0;
    const totalFromChain = filteredRows.reduce((sum, row) => sum + row.your_cut, 0);
    const totalChainCommission = filteredRows.length > 0 ? filteredRows[0].total_chain_commission : 0;
    const activePartners = new Set(filteredRows.map((row) => row.source_partner_id)).size;

    return {
      ownKeep,
      totalFromChain,
      totalChainCommission,
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

  // Column definitions with resizable flag
  const columnDefs: DataTableColumn<ChainCommissionRow>[] = useMemo(() => [
    {
      accessor: 'source_partner_id',
      title: 'Đại lý',
      width: 200,
      resizable: true,
      render: (row) => (
        <Stack gap={2}>
          <Text size="sm" fw={600} >
            {row.source_partner_id}
          </Text>
          <Text size="xs" c="dimmed">
            {row.source_email || 'N/A'}
          </Text>
        </Stack>
      ),
    },
    {
      accessor: 'source_rank',
      title: 'Hạng',
      width: 90,
      resizable: true,
      render: (row) => (
        <Badge variant="light" color="violet" size="sm">
          {row.source_rank}
        </Badge>
      ),
    },
    // {
    //   accessor: 'your_role',
    //   title: 'Vai trò',
    //   width: 100,
    //   resizable: true,
    //   render: (row) => (
    //     <Badge variant="dot" color={getRoleBadgeColor(row.your_role)} size="sm">
    //       {row.your_role}
    //     </Badge>
    //   ),
    // },
    {
      accessor: 'source_total_reward',
      title: 'Com Đại lý',
      width: 120,
      resizable: true,
      render: (row) => <Text size="sm">${fmt(row.source_total_reward)}</Text>,
    },
    {
      accessor: 'commission_pool',
      title: 'Quỹ Hoa hồng',
      width: 150,
      resizable: true,
      render: (row) => (
        <Stack gap={2}>
          <Text size="sm">${fmt(row.commission_pool)}</Text>
          <Text size="xs" c="dimmed">
            {fmt((row.commission_pool / row.source_total_reward) * 100)}% chia upline
          </Text>
        </Stack>
      ),
    },
    {
      accessor: 'tradi_fee',
      title: 'Phí Tradi (5%)',
      width: 120,
      resizable: true,
      render: (row) => (
        <Text size="sm" c="dimmed">
          ${fmt(row.tradi_fee)}
        </Text>
      ),
    },
    // {
    //   accessor: 'remaining_pool',
    //   title: 'Quỹ còn lại',
    //   width: 130,
    //   resizable: true,
    //   render: (row) => (
    //     <Text size="sm" c="orange" fw={600}>
    //       ${fmt(row.remaining_pool)}
    //     </Text>
    //   ),
    // },
    // {
    //   accessor: 'total_upliner_count',
    //   title: 'Tổng Đại lý upline',
    //   width: 160,
    //   resizable: true,
    //   render: (row) => <Text size="sm">{row.total_upliner_count}</Text>,
    // },
    // {
    //   accessor: 'upliner_share',
    //   title: 'Upline 50% chia đều',
    //   width: 120,
    //   resizable: true,
    //   render: (row) => (
    //     <Text size="sm" c="teal">
    //       {row.total_upliner_count === 0 ? '' : `$${fmt(row.upliner_share)}`}
    //     </Text>
    //   ),
    // },
    {
      accessor: 'your_cut',
      title: 'Hoa hồng của bạn',
      width: 140,
      resizable: true,
      render: (row) => (
        <Text size="sm" fw={700} c="blue">
          ${fmt(row.your_cut)}
        </Text>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const { effectiveColumns } = useDataTableColumns<ChainCommissionRow>({
    key: STORE_KEY,
    columns: columnDefs,
    scrollViewportRef,
  });

  return (
    <div className={styles.container}>
      <Stack gap="lg">
        {/* Summary Cards */}
        <SimpleGrid cols={3} spacing="md">
          <Paper p="md" withBorder className={styles.summaryCard}>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                {userRewardPercentage && userTotalReward
                  ? `${userRewardPercentage}% của $${userTotalReward}`
                  : 'Phần thưởng từ khách hàng của bạn'}
              </Text>
              <Text size="xl" fw={700} c="blue">
                ${fmt(summary.ownKeep)}
              </Text>
            </Stack>
          </Paper>

          <Paper p="md" withBorder className={styles.summaryCard}>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                 Com từ các Đại lý
              </Text>
              <Text size="xl" fw={700} c="orange">
                ${fmt(summary.totalFromChain)}
              </Text>
            </Stack>
          </Paper>

          <Paper p="md" withBorder className={styles.summaryCard}>
            <Stack gap={4}>
              <Text size="sm" c="dimmed">
                Thưởng tháng này ({`${userRewardPercentage}% + Com từ các Đại lý`})
              </Text>
              <Text size="xl" fw={700} c="green">
                ${fmt(summary.totalChainCommission)}
              </Text>
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* Filter */}
        {chainRoots.length > 1 && (
          <Select
            label="Lọc theo Đại lý trực tiếp"
            placeholder="Chọn một đại lý trực tiếp"
            data={[
              { value: 'all', label: 'Tất cả đại lý' },
              ...chainRoots.map((rootId) => {
                const row = rows.find((r) => r.source_partner_id === rootId);
                return {
                  value: rootId,
                  label: row?.source_email || rootId,
                };
              }),
            ]}
            value={selectedChainRoot}
            onChange={handleChainRootChange}
            clearable={false}
          />
        )}

        {/* Commission Table — indirect partners are invisible here but counted in summary */}
        <Paper withBorder>
          <DataTable
            striped
            highlightOnHover
            withTableBorder={false}
            storeColumnsKey={STORE_KEY}
            scrollViewportRef={scrollViewportRef}
            records={paginatedRows}
            // Pagination counts only visible (non-indirect) rows
            totalRecords={visibleRows.length}
            recordsPerPage={pageSize}
            page={page}
            onPageChange={setPage}
            recordsPerPageOptions={PAGE_SIZES}
            onRecordsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
            columns={effectiveColumns}
            noRecordsText="Không có dữ liệu hoa hồng"
          />
        </Paper>
      </Stack>
    </div>
  );
}
