'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@mantine/core';
import Image from 'next/image';
import classes from './LoadingScreen.module.css';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

export function LoadingScreen({ onLoadingComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showCircle, setShowCircle] = useState(false);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Trigger circle expansion after a brief delay
          setTimeout(() => {
            setShowCircle(true);
            // Call onLoadingComplete after circle animation
            setTimeout(() => {
              onLoadingComplete();
            }, 800);
          }, 300);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onLoadingComplete]);

  return (
    <div className={classes.root}>
      {/* Circle overlay that expands */}
      <div className={`${classes.circle} ${showCircle ? classes.circleExpanded : ''}`} />

      {/* Content */}
      <div className={classes.content}>
        <Image
          src="/vnclc-logo.png"
          alt="VNCLC Logo"
          width={181}
          height={40}
          priority
          className={classes.logo}
        />
        
        <div className={classes.progressContainer}>
          <Progress
            value={progress}
            size="md"
            radius="xl"
            color="rgba(255, 184, 28, 1)"
            className={classes.progress}
          />
        </div>
      </div>
    </div>
  );
}