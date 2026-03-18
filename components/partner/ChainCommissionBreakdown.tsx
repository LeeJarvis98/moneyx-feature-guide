'use client';

import { useMemo, useRef, useState } from 'react';
import { Stack, Paper, Text, Badge, Select } from '@mantine/core';
import { DataTable, useDataTableColumns, type DataTableColumn } from 'mantine-datatable';
import type { NetworkSnapshotNode } from '@/types';
import styles from './ChainCommissionBreakdown.module.css';

const PAGE_SIZES = [5, 10, 20, 50];
const STORE_KEY = 'chain-commission-breakdown-v2';

// Display number stripped of JS float noise (e.g. 245.23600000000002 → 245.236)
const fmt = (n: number) => parseFloat(n.toPrecision(10)).toString();

interface ChainCommissionBreakdownProps {
  nodes: NetworkSnapshotNode[];
}

// Collect all user_ids in the subtree rooted at rootUserId (inclusive)
function collectSubtree(rootUserId: string, allNodes: NetworkSnapshotNode[]): Set<string> {
  const result = new Set<string>([rootUserId]);
  const queue = [rootUserId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    allNodes.forEach((n) => {
      if (n.parent_user_id === current && !result.has(n.user_id)) {
        result.add(n.user_id);
        queue.push(n.user_id);
      }
    });
  }
  return result;
}

export default function ChainCommissionBreakdown({ nodes }: ChainCommissionBreakdownProps) {
  const [selectedDirectPartner, setSelectedDirectPartner] = useState<string | null>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  // All partner nodes (Direct + Indirect)
  const partnerNodes = useMemo(
    () => nodes.filter((n) => n.role === 'Direct Partner' || n.role === 'Indirect Partner'),
    [nodes]
  );

  // Direct partners for the filter dropdown
  const directPartners = useMemo(
    () => nodes.filter((n) => n.role === 'Direct Partner'),
    [nodes]
  );

  // Filtered partner nodes for current selection
  const filteredPartners = useMemo(() => {
    if (!selectedDirectPartner || selectedDirectPartner === 'all') return partnerNodes;
    const subtree = collectSubtree(selectedDirectPartner, nodes);
    return partnerNodes.filter((n) => subtree.has(n.user_id));
  }, [selectedDirectPartner, partnerNodes, nodes]);

  const handleFilterChange = (value: string | null) => {
    setSelectedDirectPartner(value);
    setPage(1);
  };

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredPartners.slice(start, start + pageSize);
  }, [filteredPartners, page, pageSize]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Direct Partner': return 'yellow';
      case 'Indirect Partner': return 'grape';
      default: return 'gray';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Direct Partner': return 'Đại lý trực tiếp';
      case 'Indirect Partner': return 'Đại lý gián tiếp';
      default: return role;
    }
  };

  const columnDefs: DataTableColumn<NetworkSnapshotNode>[] = useMemo(() => [
    {
      accessor: 'user_id',
      title: 'Đại lý',
      width: 200,
      resizable: true,
      render: (row) => (
        <Stack gap={2}>
          <Text size="sm" fw={600}>{row.user_id}</Text>
          <Text size="xs" c="dimmed">{row.email ?? 'N/A'}</Text>
        </Stack>
      ),
    },
    {
      accessor: 'role',
      title: 'Loại',
      width: 160,
      resizable: true,
      render: (row) => (
        <Badge variant="dot" color={getRoleBadgeColor(row.role)} size="sm">
          {getRoleLabel(row.role)}
        </Badge>
      ),
    },
    {
      accessor: 'total_lots',
      title: 'Khối lượng (lots)',
      width: 150,
      resizable: true,
      render: (row) => <Text size="sm">{row.total_lots.toLocaleString()}</Text>,
    },
    {
      accessor: 'total_reward_usd',
      title: 'Hoa hồng',
      width: 160,
      resizable: true,
      render: (row) => (
        <Text size="sm" fw={700} c="blue">
          ${fmt(row.total_reward_usd)}
        </Text>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const { effectiveColumns } = useDataTableColumns<NetworkSnapshotNode>({
    key: STORE_KEY,
    columns: columnDefs,
    scrollViewportRef,
  });

  return (
    <div className={styles.container}>
      <Stack gap="lg">
        {/* Filter by direct partner — only shown when there are multiple direct partners */}
        {directPartners.length > 1 && (
          <Select
            label="Lọc theo Đại lý trực tiếp"
            placeholder="Chọn một đại lý trực tiếp"
            data={[
              { value: 'all', label: 'Tất cả đại lý' },
              ...directPartners.map((n) => ({
                value: n.user_id,
                label: n.email ?? n.user_id,
              })),
            ]}
            value={selectedDirectPartner}
            onChange={handleFilterChange}
            clearable={false}
          />
        )}

        {/* Partner table */}
        <Paper withBorder>
          <DataTable
            striped
            highlightOnHover
            withTableBorder={false}
            storeColumnsKey={STORE_KEY}
            scrollViewportRef={scrollViewportRef}
            records={paginatedRows}
            totalRecords={filteredPartners.length}
            recordsPerPage={pageSize}
            page={page}
            onPageChange={setPage}
            recordsPerPageOptions={PAGE_SIZES}
            onRecordsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
            columns={effectiveColumns}
            noRecordsText="Không có dữ liệu mạng lưới"
          />
        </Paper>
      </Stack>
    </div>
  );
}
