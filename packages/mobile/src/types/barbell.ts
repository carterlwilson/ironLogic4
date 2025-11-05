/**
 * Configuration for a single plate type
 */
export interface PlateConfig {
  weight: number;
  color: string;
  label: string;
}

/**
 * Represents a plate loaded on the barbell
 */
export interface PlateOnBar {
  weight: number;
  color: string;
  label: string;
  quantity: number; // quantity per side
}

/**
 * Result of barbell plate calculation
 */
export interface BarbellCalculation {
  targetWeight: number;
  barWeight: number;
  achievedWeight: number;
  plates: PlateOnBar[];
  totalPlateWeight: number;
  isExact: boolean;
}

/**
 * Standard barbell weights in kg
 */
export const BAR_WEIGHTS = {
  STANDARD: 20,
  WOMENS: 15,
} as const;
