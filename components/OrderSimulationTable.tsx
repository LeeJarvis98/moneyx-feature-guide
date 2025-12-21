'use client';

import { Paper, Title, Table, ScrollArea, Text, Stack, Badge, Group } from '@mantine/core';
import { useTranslations } from 'next-intl';

interface OrderRow {
  orderNumber: number;
  lot: number;
  margin: number;
  profit: number;
  cumulativeProfit: number;
}

interface OrderSimulationTableProps {
  initialLot: number;
  nextLot: number;
  dcaType: 'add' | 'multiply';
  maxOrders: number;
  dcaDistance: number;
  currencyPair: string;
}

export function OrderSimulationTable({
  initialLot,
  nextLot,
  dcaType,
  maxOrders,
  dcaDistance,
  currencyPair,
}: OrderSimulationTableProps) {
  const t = useTranslations('simulation');
  const tCommon = useTranslations('common');

  if (maxOrders === 0) {
    return (
      <Paper withBorder p="md" radius="md" style={{ background: '#1a1a1a' }}>
        <Text c="dimmed" ta="center">
          {t('setMaxOrders')}
        </Text>
      </Paper>
    );
  }

  // Calculate simulation data
  const simulationData: OrderRow[] = [];
  let currentLot = initialLot;
  let cumulativeProfit = 0;

  const pipValue = currencyPair === 'XAUUSD' ? 0.1 : 1;

  for (let i = 1; i <= maxOrders; i++) {
    // Calculate profit per order (if price moves back by DCA distance)
    const profit = currentLot * dcaDistance * pipValue;
    cumulativeProfit += profit;

    // Calculate margin: (maxOrders - orderNumber + 1) * (dcaDistance / 100)
    const margin = (maxOrders - i + 1) * (dcaDistance / 100);

    simulationData.push({
      orderNumber: i,
      lot: parseFloat(currentLot.toFixed(2)),
      margin: parseFloat(margin.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      cumulativeProfit: parseFloat(cumulativeProfit.toFixed(2)),
    });

    // Calculate next lot size
    if (i < maxOrders) {
      if (dcaType === 'add') {
        currentLot += nextLot;
      } else {
        currentLot *= (nextLot / initialLot);
      }
    }
  }

  const rows = simulationData.map((row) => (
    <Table.Tr key={row.orderNumber}>
      <Table.Td>
        <Badge variant="light" color="accent" size="lg">
          {row.orderNumber}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text fw={500} c="white">
          {row.lot}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fw={500} c="orange">
          {row.margin}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fw={500} c="green">
          +${row.profit}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text fw={700} c="green">
          +${row.cumulativeProfit}
        </Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper withBorder p="lg" radius="md" style={{ background: '#1a1a1a', height: '100%' }}>
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="center">
          <Badge variant="filled" color="accent" size="lg">
            {maxOrders} {t('orders')}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed">
          {t('description')}
        </Text>

        <ScrollArea style={{ flex: 1 }} type="auto">
          <Table
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders
            styles={{
              table: {
                backgroundColor: '#2a2a2a',
                borderColor: '#444',
              },
              th: {
                backgroundColor: '#333',
                color: '#FFB81C',
                fontWeight: 700,
                fontSize: '0.875rem',
              },
              td: {
                borderColor: '#444',
              },
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('orderNo')}</Table.Th>
                <Table.Th>{t('lot')}</Table.Th>
                <Table.Th>{t('margin')}</Table.Th>
                <Table.Th>{t('profit')}</Table.Th>
                <Table.Th>{t('cumProfit')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </ScrollArea>
      </Stack>
    </Paper>
  );
}
