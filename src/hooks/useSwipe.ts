import { useState, TouchEvent, MouseEvent } from "react";

export type Direction = "up" | "down" | "left" | "right";

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
  onMouseDown: (e: MouseEvent) => void;
  onMouseUp: (e: MouseEvent) => void;
}

export function useSwipe(onSwipe: (direction: Direction) => void): SwipeHandlers {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [mouseStart, setMouseStart] = useState<{ x: number; y: number } | null>(null);

  const minSwipeDistance = 50;

  const handleStart = (x: number, y: number) => {
    return { x, y };
  };

  const handleEnd = (startX: number, startY: number, endX: number, endY: number) => {
    const distanceX = endX - startX;
    const distanceY = endY - startY;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (Math.abs(distanceX) < minSwipeDistance && Math.abs(distanceY) < minSwipeDistance) return;

    if (isHorizontalSwipe) {
      onSwipe(distanceX > 0 ? "right" : "left");
    } else {
      onSwipe(distanceY > 0 ? "down" : "up");
    }
  };

  return {
    onTouchStart: (e: TouchEvent) => setTouchStart(handleStart(e.targetTouches[0].clientX, e.targetTouches[0].clientY)),
    onTouchEnd: (e: TouchEvent) => {
      if (!touchStart) return;
      handleEnd(touchStart.x, touchStart.y, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      setTouchStart(null);
    },
    onMouseDown: (e: MouseEvent) => setMouseStart(handleStart(e.clientX, e.clientY)),
    onMouseUp: (e: MouseEvent) => {
      if (!mouseStart) return;
      handleEnd(mouseStart.x, mouseStart.y, e.clientX, e.clientY);
      setMouseStart(null);
    },
  };
}
