'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Stack, Paper, Text, Badge, TextInput } from '@mantine/core';
import { DataTable, useDataTableColumns, DataTableSortStatus, type DataTableColumn } from 'mantine-datatable';
import 'mantine-datatable/styles.layer.css';
import styles from './ClientReports.module.css';

const PAGE_SIZES = [5, 10, 20, 50];
const STORE_KEY = 'client-reports-v1';

interface RegisteredAccount {
  accountId: string;
  email: string;
  uid: string;
  platform: string;
  licensedDate: string | null;
  licensedStatus: string;
  registeredAt: string | null;
  lotVolume: number;
  reward: number;
}

interface TableRow {
  id: string;
  index: number;
  account_id: string;
  email: string;
  platform: string;
  registered_at: string;
  lot_volume: number;
  reward: number;
  licensed_status: string;
}

const formatNumber = (value: number, decimals = 2): string =>
  isNaN(value) ? '0.00' : value.toFixed(decimals);

interface ClientReportsProps {
  autoFetch?: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  licensed: 'green',
  unlicensed: 'gray',
  revoked: 'red',
};

const STATUS_LABEL: Record<string, string> = {
  licensed: 'Đã cấp phép',
  unlicensed: 'Chưa cấp phép',
  revoked: 'Đã thu hồi',
};

const PLATFORM_COLOR: Record<string, string> = {
  exness: 'blue',
};

export default function ClientReports({ autoFetch = true }: ClientReportsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<RegisteredAccount[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<TableRow>>({
    columnAccessor: 'index',
    direction: 'asc',
  });
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    if (autoFetch && !hasFetched && !loading) {
      fetchRegisteredAccounts();
    }
  }, [autoFetch]);

  const fetchRegisteredAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/get-registered-accounts');
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Không thể tải danh sách tài khoản');
      }

      setAccounts(json.data as RegisteredAccount[]);
      setHasFetched(true);
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filteredSortedRecords = useMemo(() => {
    const records: TableRow[] = accounts.map((account, index) => ({
      id: account.accountId,
      index: index + 1,
      account_id: account.accountId,
      email: account.email,
      platform: account.platform,
      registered_at: account.registeredAt ?? 'N/A',
      licensed_status: account.licensedStatus,
      lot_volume: account.lotVolume,
      reward: account.reward,
    }));

    const filtered = filterQuery
      ? records.filter((r) => {
          const q = filterQuery.toLowerCase();
          return (
            r.account_id.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q) ||
            r.registered_at.toLowerCase().includes(q) ||
            r.licensed_status.toLowerCase().includes(q)
          );
        })
      : records;

    return [...filtered].sort((a, b) => {
      const accessor = sortStatus.columnAccessor as keyof TableRow;
      const aVal = a[accessor];
      const bVal = b[accessor];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortStatus.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (sortStatus.direction === 'asc') return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
      return aStr < bStr ? 1 : aStr > bStr ? -1 : 0;
    });
  }, [accounts, sortStatus, filterQuery]);

  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSortedRecords.slice(start, start + pageSize);
  }, [filteredSortedRecords, page, pageSize]);

  const columnDefs: DataTableColumn<TableRow>[] = useMemo(() => [
    {
      accessor: 'index',
      title: '#',
      width: 60,
      resizable: false,
      sortable: true,
      textAlign: 'center',
      render: (row) => <Text size="sm" c="dimmed">{row.index}</Text>,
    },
    {
      accessor: 'account_id',
      title: 'Tài khoản',
      width: 150,
      resizable: true,
      sortable: true,
      render: (row) => (
        <Text size="sm" fw={600} c="yellow">
          {row.account_id}
        </Text>
      ),
    },
    {
      accessor: 'email',
      title: 'Email',
      width: 220,
      resizable: true,
      sortable: true,
      render: (row) => <Text size="sm">{row.email}</Text>,
    },
    {
      accessor: 'platform',
      title: 'Nền tảng',
      width: 120,
      resizable: true,
      sortable: true,
      render: (row) => {
        const p = row.platform || 'exness';
        return (
          <Badge variant="light" color={PLATFORM_COLOR[p.toLowerCase()] ?? 'blue'} size="sm">
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessor: 'registered_at',
      title: 'Ngày đăng ký',
      width: 180,
      resizable: true,
      sortable: true,
      render: (row) => <Text size="sm" c="dimmed">{row.registered_at}</Text>,
    },
    {
      accessor: 'lot_volume',
      title: 'Khối lượng (Lot)',
      width: 150,
      resizable: true,
      sortable: true,
      render: (row) => <Text size="sm">{formatNumber(row.lot_volume)}</Text>,
    },
    {
      accessor: 'reward',
      title: 'Thưởng (USD)',
      width: 140,
      resizable: true,
      sortable: true,
      render: (row) => (
        <Text size="sm" fw={700} c="green">
          ${formatNumber(row.reward)}
        </Text>
      ),
    },
    {
      accessor: 'licensed_status',
      title: 'Trạng thái',
      width: 150,
      resizable: true,
      sortable: true,
      render: (row) => (
        <Badge
          variant="dot"
          color={STATUS_COLOR[row.licensed_status] ?? 'gray'}
          size="sm"
        >
          {STATUS_LABEL[row.licensed_status] ?? row.licensed_status}
        </Badge>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const { effectiveColumns } = useDataTableColumns<TableRow>({
    key: STORE_KEY,
    columns: columnDefs,
    scrollViewportRef,
  });

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Khách hàng</h2>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className={styles.loadingState}>Đang tải dữ liệu...</div>
      )}

      {!loading && hasFetched && (
        <Stack gap="lg">
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <h4>Tài khoản đã cấp phép</h4>
              <p className={styles.summaryValue}>
                {accounts.filter((a) => a.licensedStatus === 'licensed').length}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <h4>Tài khoản chưa cấp phép</h4>
              <p className={styles.summaryValue}>
                {accounts.filter((a) => a.licensedStatus !== 'licensed').length}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <h4>Khối lượng (Lot)</h4>
              <p className={styles.summaryValue}>
                {formatNumber(accounts.reduce((sum, a) => sum + a.lotVolume, 0))}
              </p>
            </div>
            <div className={styles.summaryCard}>
              <h4>Tổng thưởng (USD)</h4>
              <p className={styles.summaryValue}>
                ${formatNumber(accounts.reduce((sum, a) => sum + a.reward, 0))}
              </p>
            </div>
          </div>

          <h3 className={styles.sectionListHeading}>
            Danh sách tài khoản ({filteredSortedRecords.length})
          </h3>

          <TextInput
            placeholder="Tìm kiếm theo tài khoản, email, ngày hoặc trạng thái..."
            value={filterQuery}
            onChange={(e) => { setFilterQuery(e.currentTarget.value); setPage(1); }}
            className={styles.filterInput}
            styles={{
              input: {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                border: '1px solid rgba(255, 184, 28, 0.3)',
                '&:focus': { borderColor: '#FFB81C' },
              },
            }}
          />

          <Paper withBorder>
            <DataTable
              striped
              highlightOnHover
              withTableBorder={false}
              storeColumnsKey={STORE_KEY}
              scrollViewportRef={scrollViewportRef}
              records={paginatedRecords}
              totalRecords={filteredSortedRecords.length}
              recordsPerPage={pageSize}
              page={page}
              onPageChange={setPage}
              recordsPerPageOptions={PAGE_SIZES}
              onRecordsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
              sortStatus={sortStatus}
              onSortStatusChange={(s) => { setSortStatus(s); setPage(1); }}
              columns={effectiveColumns}
              noRecordsText="Không có tài khoản nào"
            />
          </Paper>
        </Stack>
      )}
    </div>
  );
}
