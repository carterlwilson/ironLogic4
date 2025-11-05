import { useState, useMemo } from 'react';
import { calculateBarbellPlates } from '../../../utils/barbellCalculations';
import { BarbellCalculation, BAR_WEIGHTS } from '../../../types/barbell';

export type BarType = 'standard' | 'womens';

export interface UseBarbellCalculatorReturn {
  calculation: BarbellCalculation;
  barType: BarType;
  setBarType: (type: BarType) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Custom hook for managing barbell plate calculations
 *
 * Handles:
 * - Bar type selection (standard 20kg or women's 15kg)
 * - Memoized plate calculations
 * - Drawer open/close state
 *
 * @param targetWeight - The desired total weight in kg
 * @returns Object with calculation results and state management functions
 *
 * @example
 * ```typescript
 * const { calculation, barType, setBarType, isOpen, open, close } =
 *   useBarbellCalculator(100);
 * ```
 */
export function useBarbellCalculator(targetWeight: number): UseBarbellCalculatorReturn {
  const [barType, setBarType] = useState<BarType>('standard');
  const [isOpen, setIsOpen] = useState(false);

  // Memoize calculation to avoid recalculating on every render
  const calculation = useMemo(() => {
    const barWeight = barType === 'standard' ? BAR_WEIGHTS.STANDARD : BAR_WEIGHTS.WOMENS;
    return calculateBarbellPlates(targetWeight, barWeight);
  }, [targetWeight, barType]);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    calculation,
    barType,
    setBarType,
    isOpen,
    open,
    close,
  };
}
