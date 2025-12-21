'use client';

import { Paper, Title, Stack, Text, Group, ScrollArea, Button, useMantineTheme } from '@mantine/core';
import { Clock, TrendingUp, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface SavedResult {
   id: string;
   timestamp: Date;
   accountBalance: number;
   currencyPair: string;
   dcaType: 'add' | 'multiply';
   dcaDistance: number;
   initialLot: number;
   nextLot: number;
   maxOrders: number;
   result: {
      totalLot: number;
      statusPercent: number;
      margin: number;
      drawdownPrice: number;
      totalOrders: number;
   };
}

interface SavedResultsAsideProps {
   savedResults: SavedResult[];
   onSelectResult: (result: SavedResult) => void;
   onDeleteResult: (id: string) => void;
   selectedResultId?: string;
}

export function SavedResultsAside({
   savedResults,
   onSelectResult,
   onDeleteResult,
   selectedResultId
}: SavedResultsAsideProps) {
   const theme = useMantineTheme();
   const t = useTranslations('calculator');
   const tS = useTranslations('savedResults');

   return (
      <Stack gap="md" h="100%">
         <Title order={3} size="h3" c="white">
            {tS('title')} ({savedResults.length})
         </Title>

         {savedResults.length === 0 ? (
            <Paper withBorder p="xl" radius="md" style={{ backgroundColor: '#1a1a1a', borderColor: '#444' }}>
               <Stack align="center" gap="md">
                  <TrendingUp size={48} color={theme.colors.accent[6]} />
                  <Text size="sm" c="dimmed" ta="center">
                     {tS('description')}
                  </Text>
               </Stack>
            </Paper>
         ) : (
            <ScrollArea style={{ flex: 1 }} type="auto">
               <Stack gap="sm">
                  {savedResults.map((saved) => (
                     <Paper
                        key={saved.id}
                        withBorder
                        p="md"
                        radius="md"
                        style={{
                           backgroundColor: selectedResultId === saved.id ? '#2a2a2a' : '#1a1a1a',
                           borderColor: selectedResultId === saved.id ? theme.colors.accent[6] : '#444',
                           cursor: 'pointer',
                           transition: 'all 0.2s',
                        }}
                        onClick={() => onSelectResult(saved)}
                     >
                        <Stack gap="xs">
                           <Group justify="space-between" align="flex-start">
                              <Stack gap={4} style={{ flex: 1 }}>
                                 <Group gap="xs">
                                    <Clock size={14} color={theme.colors.accent[6]} />
                                    <Text size="xs" c="dimmed">
                                       {saved.timestamp.toLocaleString()}
                                    </Text>
                                 </Group>
                                 <Text size="sm" fw={600} c="white">
                                    {saved.currencyPair} • ${saved.accountBalance.toLocaleString()}
                                 </Text>
                              </Stack>
                              <Button
                                 variant="subtle"
                                 color="red"
                                 size="xs"
                                 p={4}
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteResult(saved.id);
                                 }}
                              >
                                 <Trash2 size={14} />
                              </Button>
                           </Group>

                           <Group gap="md" grow>
                              <Stack gap={2}>
                                 <Text size="xs" c="dimmed">Lot</Text>
                                 <Text size="sm" fw={600} c="white">{saved.result.totalLot}</Text>
                              </Stack>
                              <Stack gap={2}>
                                 <Text size="xs" c="dimmed">Margin</Text>
                                 <Text size="sm" fw={600} c="white">{saved.result.margin}</Text>
                              </Stack>
                           </Group>

                           <Group gap="md" grow>
                              <Stack gap={2}>
                                 <Text size="xs" c="dimmed">Status</Text>
                                 <Text
                                    size="sm"
                                    fw={600}
                                    c={saved.result.statusPercent < 0 ? 'red' : 'green'}
                                 >
                                    {saved.result.statusPercent > 0 ? '+' : ''}{saved.result.statusPercent}%
                                 </Text>
                              </Stack>
                              <Stack gap={2}>
                                 <Text size="xs" c="dimmed">Orders</Text>
                                 <Text size="sm" fw={600} c="white">{saved.result.totalOrders}</Text>
                              </Stack>
                           </Group>
                        </Stack>
                     </Paper>
                  ))}
               </Stack>
            </ScrollArea>
         )}
      </Stack>
   );
}
