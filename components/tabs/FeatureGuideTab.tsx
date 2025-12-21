'use client';

import { useState, useEffect } from 'react';
import { Container, Title, Text, Grid, Stack, Paper, Group, Button, useMantineTheme } from '@mantine/core';
import { Layers, Trash2, Lightbulb } from 'lucide-react';
import { CoreCard } from '@/components/CoreCard';
import { InsightPanel } from '@/components/InsightPanel';
import { AvailableFeaturesAside } from '@/components/AvailableFeaturesAside';
import { allCards } from '@/data';
import { Card, CoreCombination } from '@/types';
import { generateCombinationInsight } from '@/lib/combinations';
import { useTranslations } from 'next-intl';

interface FeatureGuideTabProps {
  onAsideContentChange?: (content: React.ReactNode) => void;
}

export function FeatureGuideTab({ onAsideContentChange }: FeatureGuideTabProps) {
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

  // Update aside content whenever cards or modal state changes
  useEffect(() => {
    if (onAsideContentChange) {
      onAsideContentChange(
        <AvailableFeaturesAside
          enabledCards={enabledCards}
          onCardClick={handleCardClick}
          onToggleCard={handleToggleCard}
          modalCard={modalCard}
          onCloseModal={() => setModalCard(null)}
        />
      );
    }
  }, [enabledCards, modalCard, onAsideContentChange]);

  return (
    <Container size="xl">
      <Grid gutter="lg">
        <Grid.Col span={12}>
          <Stack gap="md">
            {/* Insights Section - shown above Core when cards are selected */}
            <InsightPanel combination={currentCombination} />

            {/* Core Section */}
            <Paper withBorder p="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Group gap="xs">
                  <Layers size={24} color={theme.colors.accent[6]} />
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
      </Grid>
    </Container>
  );
}
