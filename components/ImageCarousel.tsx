'use client';

import { useState } from 'react';
import classes from './ImageCarousel.module.css';

interface CarouselItem {
  id: number;
  pos: number;
  url: string;
}

export function ImageCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([
    { id: 0, pos: 0, url: '/hero_section/carousel/pic1.jpg' },
    { id: 1, pos: 1, url: '/hero_section/carousel/picc2.jpg' },
    { id: 2, pos: 2, url: '/hero_section/carousel/pic3.jpg' },
    { id: 3, pos: 3, url: '/hero_section/carousel/picc4.jpg' },
    { id: 4, pos: 4, url: '/hero_section/carousel/pic5.jpg' },
  ]);

  const shuffle = (clickedItem: CarouselItem) => {
    const heroPos = Math.floor(items.length / 2);
    const heroIndex = items.findIndex(({ pos }) => pos === heroPos);
    const targetIndex = items.findIndex(({ id }) => id === clickedItem.id);

    if (heroIndex !== -1 && targetIndex !== -1) {
      setItems((prevItems) => {
        const newItems = prevItems.map((item, index) => {
          if (index === targetIndex) {
            return { ...item, pos: prevItems[heroIndex].pos };
          }
          if (index === heroIndex) {
            return { ...item, pos: prevItems[targetIndex].pos };
          }
          return item;
        });
        return newItems;
      });
    }
  };

  return (
    <div className={classes.carouselContainer}>
      <ul className={classes.gallery}>
        {items.map((item) => (
          <li
            key={item.id}
            data-pos={item.pos}
            className={classes.galleryItem}
            style={{
              transform: `translateX(calc(var(--item-spacing) * ${item.pos - 2})) scale(${getScale(item.pos)})`,
              backgroundImage: `url(${item.url})`,
            }}
            onClick={() => shuffle(item)}
          />
        ))}
      </ul>
    </div>
  );
}

function getScale(pos: number): number {
  switch (pos) {
    case 0:
    case 4:
      return 1;
    case 1:
    case 3:
      return 1.4;
    case 2:
      return 1.8;
    default:
      return 1;
  }
}
