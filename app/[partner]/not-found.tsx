import Link from 'next/link';
import { Container, Title, Text, Button, Stack } from '@mantine/core';

export default function PartnerNotFound() {
  return (
    <Container size="sm" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Stack align="center" gap="xl">
        <Title order={1} size="h1">404</Title>
        <Title order={2}>Partner Not Found</Title>
        <Text size="lg" c="dimmed" ta="center">
          The partner you're looking for doesn't exist or is currently inactive.
        </Text>
        <Link href="/">
          <Button size="lg">
            Go to Home
          </Button>
        </Link>
      </Stack>
    </Container>
  );
}
