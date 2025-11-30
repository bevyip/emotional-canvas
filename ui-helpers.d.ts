// Type declarations for ui-helpers.js

export function createRGBDisplay(container: HTMLElement): {
  rgbDisplay: HTMLElement;
  rgbPills: {
    r: HTMLElement | null;
    g: HTMLElement | null;
    b: HTMLElement | null;
    a: HTMLElement | null;
  };
};

export function updateRGBDisplay(
  rgbDisplay: HTMLElement | null,
  rgbPills: {
    r: HTMLElement | null;
    g: HTMLElement | null;
    b: HTMLElement | null;
    a: HTMLElement | null;
  },
  globalRGB: { r: number; g: number; b: number; a: number },
  keyHoldState: {
    1: { isHolding: boolean; startTime: number };
    2: { isHolding: boolean; startTime: number };
    3: { isHolding: boolean; startTime: number };
    4: { isHolding: boolean; startTime: number };
  }
): void;

export function createCreationHelpers(container: HTMLElement): {
  sizeHelper: null;
  roundnessHelper: null;
  showSizeHelper: () => void;
  showRoundnessHelper: () => void;
};

export function createCameraHelpers(container: HTMLElement): void;

