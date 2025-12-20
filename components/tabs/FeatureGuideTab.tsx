'use client';

import { useState } from 'react';
import { Container, Title, Text, Grid, Stack, Paper, Group, Button, useMantineTheme, ScrollArea } from '@mantine/core';
import { Layers, Trash2, Lightbulb } from 'lucide-react';
import { FeatureCard } from '@/components/FeatureCard';
import { CoreCard } from '@/components/CoreCard';
import { InsightPanel } from '@/components/InsightPanel';
import { CardDetailModal } from '@/components/CardDetailModal';
import { allCards } from '@/data';
import { Card, CoreCombination } from '@/types';
import { generateCombinationInsight } from '@/lib/combinations';
import { useTranslations } from 'next-intl';

export function FeatureGuideTab() {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [currentCombination, setCurrentCombination] = useState<CoreCombination | null>(null);
  const [modalCard, setModalCard] = useState<Card | null>(null);
  const [enabledCards, setEnabledCards] = useState<Set<string>>(new Set());
  const t = useTranslations('core');
  const tCommon = useTranslations('common');

  const handleCardClick = (card: Card) => {
    setModalCard(card);
  };

  const handleToggleCard = (cardId: string, enabled: boolean) => {
    setEnabledCards((prev) => {
      const next = new Set(prev);
      if (enabled) {
        next.add(cardId);
      } else {
        next.delete(cardId);
      }
      return next;
    });

    // Update selected cards for core
    if (enabled) {
      const card = allCards.find((c) => c.id === cardId);
      if (card && !selectedCards.find((c) => c.id === cardId)) {
        const newSelection = [...selectedCards, card];
        setSelectedCards(newSelection);
        setCurrentCombination(generateCombinationInsight(newSelection));
      }
    } else {
      const newSelection = selectedCards.filter((c) => c.id !== cardId);
      setSelectedCards(newSelection);
      setCurrentCombination(
        newSelection.length > 0 ? generateCombinationInsight(newSelection) : null
      );
    }
  };

  const handleRemoveCard = (cardId: string) => {
    const newSelection = selectedCards.filter((c) => c.id !== cardId);
    setSelectedCards(newSelection);
    setCurrentCombination(
      newSelection.length > 0 ? generateCombinationInsight(newSelection) : null
    );
    // Remove from enabled cards as well
    setEnabledCards((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  };

  const handleClearAll = () => {
    setSelectedCards([]);
    setCurrentCombination(null);
    setEnabledCards(new Set());
  };

  const theme = useMantineTheme();

  return (
    <Container size="xl">
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md">
            {/* Insights Section - shown above Core when cards are selected */}
            <InsightPanel combination={currentCombination} />

            {/* Core Section */}
            <Paper withBorder p="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <Layers size={24} color={theme.colors.accent[6]}/>
                  <Title order={3} size="h4" c={theme.white}>
                    {t('title')} ({selectedCards.length})
                  </Title>
                </Group>
                {selectedCards.length > 0 && (
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    leftSection={<Trash2 size={16} />}
                    onClick={handleClearAll}
                  >
                    {tCommon('clearAll')}
                  </Button>
                )}
              </Group>

              {selectedCards.length === 0 ? (
                <Stack align="center" gap="md" py="xl">
                  <Lightbulb size={48} color={theme.colors.accent[6]} />
                  <Text size="lg" ta="center">
                    {t('emptyMessage')}
                  </Text>
                  <Text size="sm" c="dimmed" ta="center">
                    {t('hint')}
                  </Text>
                </Stack>
              ) : (
                <Stack gap="sm">
                  {selectedCards.map((card) => (
                    <CoreCard
                      key={card.id}
                      card={card}
                      onRemove={() => handleRemoveCard(card.id)}
                    />
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            <Title order={2} size="h3" c={theme.white}>
              Available Features
            </Title>
            <ScrollArea h="calc(100vh - 200px)" type="never" scrollbars="y">
              <Grid>
                {allCards.map((card) => (
                  <Grid.Col key={card.id} span={12}>
                    <FeatureCard
                      card={card}
                      onClick={() => handleCardClick(card)}
                      isEnabled={enabledCards.has(card.id)}
                      onToggle={(enabled) => handleToggleCard(card.id, enabled)}
                    />
                  </Grid.Col>
                ))}
              </Grid>
            </ScrollArea>

            <CardDetailModal
              card={modalCard}
              isOpen={modalCard !== null}
              onClose={() => setModalCard(null)}
              isEnabled={modalCard ? enabledCards.has(modalCard.id) : false}
              onToggle={(enabled) => {
                if (modalCard) {
                  handleToggleCard(modalCard.id, enabled);
                }
              }}
            />
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}
