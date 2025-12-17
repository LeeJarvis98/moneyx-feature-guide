'use client';

import { useState } from 'react';
import { Container, Title, Text, Grid, Stack, Paper, Group, Button } from '@mantine/core';
import { Layers, Trash2 } from 'lucide-react';
import { FeatureCard } from '@/components/FeatureCard';
import { CoreCard } from '@/components/CoreCard';
import { InsightPanel } from '@/components/InsightPanel';
import { allCards } from '@/data';
import { Card, CoreCombination } from '@/types';
import { generateCombinationInsight } from '@/lib/combinations';

export default function HomePage() {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [currentCombination, setCurrentCombination] = useState<CoreCombination | null>(null);

  const handleCardClick = (card: Card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      // Remove card
      const newSelection = selectedCards.filter((c) => c.id !== card.id);
      setSelectedCards(newSelection);
      setCurrentCombination(
        newSelection.length > 0 ? generateCombinationInsight(newSelection) : null
      );
    } else {
      // Add card
      const newSelection = [...selectedCards, card];
      setSelectedCards(newSelection);
      setCurrentCombination(generateCombinationInsight(newSelection));
    }
  };

  const handleRemoveCard = (cardId: string) => {
    const newSelection = selectedCards.filter((c) => c.id !== cardId);
    setSelectedCards(newSelection);
    setCurrentCombination(
      newSelection.length > 0 ? generateCombinationInsight(newSelection) : null
    );
  };

  const handleClearAll = () => {
    setSelectedCards([]);
    setCurrentCombination(null);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="sm">
            MoneyX Feature Guide
          </Title>
          <Text size="lg" c="dimmed">
            Select features to discover powerful combinations and insights
          </Text>
        </div>

        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Stack gap="md">
              <Title order={2} size="h3">
                Available Features
              </Title>
              <Grid>
                {allCards.map((card) => (
                  <Grid.Col key={card.id} span={{ base: 12, sm: 6, lg: 4 }}>
                    <FeatureCard
                      card={card}
                      onClick={() => handleCardClick(card)}
                      isSelected={!!selectedCards.find((c) => c.id === card.id)}
                    />
                  </Grid.Col>
                ))}
              </Grid>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md" style={{ position: 'sticky', top: 20 }}>
              <Paper withBorder p="lg" radius="md">
                <Group justify="space-between" mb="md">
                  <Group gap="xs">
                    <Layers size={24} />
                    <Title order={3} size="h4">
                      Core ({selectedCards.length})
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
                      Clear All
                    </Button>
                  )}
                </Group>

                {selectedCards.length === 0 ? (
                  <Text size="sm" c="dimmed" ta="center" py="xl">
                    Click on features to add them to the core
                  </Text>
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

              <InsightPanel combination={currentCombination} />
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
}
