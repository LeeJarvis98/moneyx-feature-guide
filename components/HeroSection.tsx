'use client';

import { Button, Container, Text, Title } from '@mantine/core';
import { ArrowRight } from 'lucide-react';
import classes from './HeroSection.module.css';

interface HeroSectionProps {
  onGetStarted: () => void;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  return (
    <div className={classes.root}>
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className={classes.videoBackground}
      >
        <source src="/vnclc-landing-video.mp4" type="video/mp4" />
      </video>

      {/* Overlay for better text readability */}
      <div className={classes.overlay} />

      {/* Content */}
      <Container size="lg" className={classes.container}>
        <div className={classes.inner}>
          <div className={classes.content}>
            <Title className={classes.title}>
              A{' '}
              <Text
                component="span"
                inherit
                variant="gradient"
                gradient={{ from: 'pink', to: 'yellow' }}
              >
                fully featured
              </Text>{' '}
              Trading Education Platform
            </Title>

            <Text className={classes.description} mt={30}>
              Master the art of trading with our comprehensive guides, profit calculators, and 
              step-by-step lessons. Whether you're a beginner or an experienced trader, we've 
              got you covered with all the tools and knowledge you need to succeed.
            </Text>

            <Button
              variant="gradient"
              gradient={{ from: 'pink', to: 'yellow' }}
              size="xl"
              className={classes.control}
              mt={40}
              rightSection={<ArrowRight size={20} />}
              onClick={onGetStarted}
            >
              Get started
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}