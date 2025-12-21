'use client';

import { Title, Grid, Stack, ScrollArea, useMantineTheme } from '@mantine/core';
import { FeatureCard } from '@/components/FeatureCard';
import { CardDetailModal } from '@/components/CardDetailModal';
import { allCards } from '@/data';
import { Card } from '@/types';

interface AvailableFeaturesAsideProps {
  enabledCards: Set<string>;
  onCardClick: (card: Card) => void;
  onToggleCard: (cardId: string, enabled: boolean) => void;
  modalCard: Card | null;
  onCloseModal: () => void;
}

export function AvailableFeaturesAside({
  enabledCards,
  onCardClick,
  onToggleCard,
  modalCard,
  onCloseModal,
}: AvailableFeaturesAsideProps) {
  const theme = useMantineTheme();

  return (
    <Stack gap="md" h="100%">
      <Title order={2} size="h3" c={theme.white}>
        Available Features ({allCards.length})
      </Title>
      <ScrollArea h="calc(100vh - 200px)" type="never" scrollbars="y">
        <Grid>
          {allCards.map((card) => (
            <Grid.Col key={card.id} span={12}>
              <FeatureCard
                card={card}
                onClick={() => onCardClick(card)}
                isEnabled={enabledCards.has(card.id)}
                onToggle={(enabled) => onToggleCard(card.id, enabled)}
              />
            </Grid.Col>
          ))}
        </Grid>
      </ScrollArea>
      <CardDetailModal
        card={modalCard}
        isOpen={modalCard !== null}
        onClose={onCloseModal}
        isEnabled={modalCard ? enabledCards.has(modalCard.id) : false}
        onToggle={(enabled) => {
          if (modalCard) {
            onToggleCard(modalCard.id, enabled);
          }
        }}
      />
    </Stack>
  );
}
