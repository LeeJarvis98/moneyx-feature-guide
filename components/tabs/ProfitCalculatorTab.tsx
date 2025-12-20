'use client';

import { useState } from 'react';
import { Container, Title, Paper, Stack, useMantineTheme, Grid, NumberInput, Select, Button, Group, Text } from '@mantine/core';
import { useTranslations } from 'next-intl';

interface CurrencyPair {
  value: string;
  label: string;
  pipValue: number;
  contractSize: number;
}

const CURRENCY_PAIRS: CurrencyPair[] = [
  { value: 'XAUUSD', label: 'XAUUSD', pipValue: 0.01, contractSize: 100 },
  { value: 'EURUSD', label: 'EURUSD', pipValue: 0.0001, contractSize: 100000 },
  { value: 'GBPUSD', label: 'GBPUSD', pipValue: 0.0001, contractSize: 100000 },
  { value: 'USDJPY', label: 'USDJPY', pipValue: 0.01, contractSize: 100000 },
];

interface CalculationResult {
  totalLot: number;
  statusPercent: number;
  margin: number;
  drawdownPrice: number;
  totalOrders: number;
}

export function ProfitCalculatorTab() {
  const theme = useMantineTheme();
  const t = useTranslations('calculator');
  const tCommon = useTranslations('common');

  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [currencyPair, setCurrencyPair] = useState<string>('XAUUSD');
  const [dcaType, setDcaType] = useState<string>('add');
  const [dcaDistance, setDcaDistance] = useState<number>(300);
  const [initialLot, setInitialLot] = useState<number>(0.01);
  const [nextLot, setNextLot] = useState<number>(0.02);
  const [maxOrders, setMaxOrders] = useState<number>(30);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateDCA = () => {
    const pair = CURRENCY_PAIRS.find(p => p.value === currencyPair);
    if (!pair) return;

    let totalLot = 0;
    let currentLot = initialLot;
    let actualMaxOrders = maxOrders;

    // If maxOrders is 0, calculate max possible orders
    if (maxOrders === 0) {
      let tempLot = initialLot;
      let tempTotal = 0;
      let orderCount = 0;
      
      // Calculate until margin exceeds account balance
      while (true) {
        tempTotal += tempLot;
        const tempMargin = tempTotal * pair.contractSize * 2500 / 100; // Assuming 1:100 leverage and XAUUSD price ~2500
        
        if (tempMargin > accountBalance * 0.9) { // Stop at 90% margin usage
          break;
        }
        
        orderCount++;
        
        if (dcaType === 'add') {
          tempLot += (nextLot - initialLot);
        } else {
          tempLot *= (nextLot / initialLot);
        }
        
        if (orderCount > 1000) break; // Safety limit
      }
      
      actualMaxOrders = orderCount;
    }

    // Calculate total lot based on DCA type
    for (let i = 0; i < actualMaxOrders; i++) {
      totalLot += currentLot;
      
      if (i < actualMaxOrders - 1) {
        if (dcaType === 'add') {
          currentLot += (nextLot - initialLot);
        } else {
          currentLot *= (nextLot / initialLot);
        }
      }
    }

    // Calculate margin (simplified)
    const pricePerUnit = currencyPair === 'XAUUSD' ? 2500 : 1.1;
    const margin = (totalLot * pair.contractSize * pricePerUnit) / 100; // Assuming 1:100 leverage

    // Calculate status percentage
    const statusPercent = ((margin / accountBalance) * 100) - 100;

    // Calculate drawdown price
    const totalPipMovement = dcaDistance * (actualMaxOrders - 1);
    const drawdownInPips = totalPipMovement;
    const drawdownPrice = -(totalLot * drawdownInPips * (currencyPair === 'XAUUSD' ? 0.1 : 1));

    setResult({
      totalLot: parseFloat(totalLot.toFixed(2)),
      statusPercent: parseFloat(statusPercent.toFixed(0)),
      margin: parseFloat(margin.toFixed(0)),
      drawdownPrice: parseFloat(drawdownPrice.toFixed(3)),
      totalOrders: actualMaxOrders,
    });
  };

  return (
    <Container size="xl">
      <Paper withBorder p="xl" radius="md" style={{ background: '#1a1a1a' }}>
        <Stack gap="lg">
          <Title order={2} size="h2" c={theme.white} ta="center" mb="md">
            {t('title')}
          </Title>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <NumberInput
                label={t('accountBalance')}
                value={accountBalance}
                onChange={(val) => setAccountBalance(Number(val) || 0)}
                min={0}
                step={1000}
                thousandSeparator=","
                styles={{
                  input: { backgroundColor: '#2a2a2a', color: 'white', borderColor: '#444' },
                  label: { color: 'white', marginBottom: 8 },
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label={t('currencyPair')}
                value={currencyPair}
                onChange={(val) => setCurrencyPair(val || 'XAUUSD')}
                data={CURRENCY_PAIRS.map(p => ({ value: p.value, label: p.label }))}
                styles={{
                  input: { backgroundColor: '#2a2a2a', color: 'white', borderColor: '#444' },
                  label: { color: 'white', marginBottom: 8 },
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Select
                label={t('dcaType')}
                value={dcaType}
                onChange={(val) => setDcaType(val || 'add')}
                data={[
                  { value: 'add', label: t('dcaTypes.add') },
                  { value: 'multiply', label: t('dcaTypes.multiply') },
                ]}
                styles={{
                  input: { backgroundColor: '#2a2a2a', color: 'white', borderColor: '#444' },
                  label: { color: 'white', marginBottom: 8 },
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <NumberInput
                label={t('dcaDistance')}
                value={dcaDistance}
                onChange={(val) => setDcaDistance(Number(val) || 0)}
                min={1}
                step={10}
                styles={{
                  input: { backgroundColor: '#2a2a2a', color: 'white', borderColor: '#444' },
                  label: { color: 'white', marginBottom: 8 },
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <NumberInput
                label={t('initialLot')}
                value={initialLot}
                onChange={(val) => setInitialLot(Number(val) || 0)}
                min={0.01}
                step={0.01}
                decimalScale={2}
                styles={{
                  input: { backgroundColor: '#2a2a2a', color: 'white', borderColor: '#444' },
                  label: { color: 'white', marginBottom: 8 },
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <NumberInput
                label={t('nextLot')}
                value={nextLot}
                onChange={(val) => setNextLot(Number(val) || 0)}
                min={0.01}
                step={0.01}
                decimalScale={2}
                styles={{
                  input: { backgroundColor: '#2a2a2a', color: 'white', borderColor: '#444' },
                  label: { color: 'white', marginBottom: 8 },
                }}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <NumberInput
                label={t('maxOrders')}
                description={t('maxOrdersNote')}
                value={maxOrders}
                onChange={(val) => setMaxOrders(Number(val) || 0)}
                min={0}
                step={1}
                styles={{
                  input: { backgroundColor: '#2a2a2a', color: 'white', borderColor: '#444' },
                  label: { color: 'white', marginBottom: 8 },
                  description: { color: '#888', marginTop: 4 },
                }}
              />
            </Grid.Col>
          </Grid>

          <Button
            onClick={calculateDCA}
            size="lg"
            fullWidth
            mt="md"
            styles={{
              root: {
                backgroundColor: theme.colors.accent[6],
                '&:hover': {
                  backgroundColor: theme.colors.accent[7],
                },
              },
            }}
          >
            {t('calculate')}
          </Button>

          {result && (
            <Paper withBorder p="md" mt="xl" style={{ backgroundColor: '#2a2a2a', borderColor: '#444' }}>
              <Grid gutter="md">
                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Stack gap={4} align="center">
                    <Text size="sm" c="dimmed">{t('results.totalLot')}</Text>
                    <Text size="xl" fw={700} c="white">{result.totalLot}</Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Stack gap={4} align="center">
                    <Text size="sm" c="dimmed">{t('results.status')}</Text>
                    <Text 
                      size="xl" 
                      fw={700} 
                      c={result.statusPercent < 0 ? 'red' : 'green'}
                    >
                      {result.statusPercent > 0 ? '+' : ''}{result.statusPercent}%
                    </Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Stack gap={4} align="center">
                    <Text size="sm" c="dimmed">{t('results.margin')}</Text>
                    <Text size="xl" fw={700} c="white">{result.margin}</Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Stack gap={4} align="center">
                    <Text size="sm" c="dimmed">{t('results.drawdownPrice')}</Text>
                    <Text 
                      size="xl" 
                      fw={700} 
                      c={result.drawdownPrice < 0 ? 'red' : 'green'}
                    >
                      {result.drawdownPrice.toFixed(3)}$
                    </Text>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Stack gap={4} align="center">
                    <Text size="sm" c="dimmed">{t('results.totalOrders')}</Text>
                    <Text size="xl" fw={700} c="white">{result.totalOrders}</Text>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Paper>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
