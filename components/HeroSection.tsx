'use client';

import { Button, Container, Text, Title } from '@mantine/core';
import { ArrowRight } from 'lucide-react';
import classes from './HeroSection.module.css';
import { ImageCarousel } from './ImageCarousel';

interface HeroSectionProps {
  onGetStarted: () => void;
  isExiting?: boolean;
}

export function HeroSection({ onGetStarted, isExiting = false }: HeroSectionProps) {
  return (
    <div className={`${classes.root} ${isExiting ? classes.exiting : ''}`}>
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
        <div className={classes.content}>
          <Title className={classes.title}>
            <Text
             component="span"
             inherit
             variant="gradient"
             gradient={{ from: '#ff0000', to: 'orange', deg: 90 }}
            >
             Việt Nam
            </Text>
            <br />
            Chất Lượng Cao
          </Title>

          <Text className={classes.description} mt={30}>
            Bot mạnh mẽ kết hợp các tính năng tài chính tối ưu nhất!
          </Text>

          <Button
            variant="gradient"
            gradient={{ from: 'red', to: 'yellow', deg: -90 }}
            size="xl"
            className={classes.control}
            mt={40}
            rightSection={<ArrowRight size={20} />}
            onClick={onGetStarted}
          >
            Khám phá Ngay
          </Button>
          <ImageCarousel />
        </div>
      </Container>
    </div>
  );
}