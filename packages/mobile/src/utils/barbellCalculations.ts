import { PlateConfig, PlateOnBar, BarbellCalculation } from '../types/barbell';

/**
 * Standard Olympic plate configurations
 * Ordered from heaviest to lightest for greedy algorithm
 */
export const PLATE_CONFIGS: PlateConfig[] = [
  { weight: 25, color: '#DC2626', label: '25kg' },  // Red
  { weight: 20, color: '#2563EB', label: '20kg' },  // Blue
  { weight: 15, color: '#EAB308', label: '15kg' },  // Yellow
  { weight: 10, color: '#16A34A', label: '10kg' },  // Green
  { weight: 5, color: '#FFFFFF', label: '5kg' },    // White
  { weight: 2.5, color: '#DC2626', label: '2.5kg' }, // Red (small)
  { weight: 1.25, color: '#64748B', label: '1.25kg' }, // Gray (small)
];

/**
 * Calculates the optimal plate configuration for a target weight using a greedy algorithm.
 *
 * The algorithm:
 * 1. Subtracts the bar weight from the target
 * 2. Divides remaining weight by 2 (plates go on both sides)
 * 3. Iterates through plates from heaviest to lightest
 * 4. For each plate, adds as many as possible without exceeding target
 * 5. Rounds to nearest 2.5kg if exact match not possible
 *
 * @param targetWeight - The total desired weight in kg (including bar)
 * @param barWeight - The weight of the barbell in kg (typically 20kg or 15kg)
 * @returns BarbellCalculation object with plate breakdown and achieved weight
 *
 * @example
 * ```typescript
 * const result = calculateBarbellPlates(100, 20);
 * // Result: 80kg in plates (40kg per side)
 * // Plates: 1x25kg, 1x10kg, 1x5kg per side
 * ```
 */
export function calculateBarbellPlates(
  targetWeight: number,
  barWeight: number
): BarbellCalculation {
  // Handle edge case: target weight less than or equal to bar weight
  if (targetWeight <= barWeight) {
    return {
      targetWeight,
      barWeight,
      achievedWeight: barWeight,
      plates: [],
      totalPlateWeight: 0,
      isExact: targetWeight === barWeight,
    };
  }

  // Calculate weight needed in plates (total for both sides)
  const totalPlateWeight = targetWeight - barWeight;

  // Weight needed per side
  let weightPerSide = totalPlateWeight / 2;

  // Round to nearest 1.25kg (smallest increment possible)
  const roundedWeightPerSide = Math.round(weightPerSide / 1.25) * 1.25;
  const isExact = Math.abs(weightPerSide - roundedWeightPerSide) < 0.01;
  weightPerSide = roundedWeightPerSide;

  // Greedy algorithm: use largest plates first
  const plates: PlateOnBar[] = [];
  let remainingWeight = weightPerSide;

  for (const plateConfig of PLATE_CONFIGS) {
    if (remainingWeight <= 0) break;

    const quantity = Math.floor(remainingWeight / plateConfig.weight);

    if (quantity > 0) {
      plates.push({
        weight: plateConfig.weight,
        color: plateConfig.color,
        label: plateConfig.label,
        quantity,
      });
      remainingWeight -= quantity * plateConfig.weight;
    }
  }

  // Calculate actual achieved weight
  const actualPlateWeight = weightPerSide * 2;
  const achievedWeight = barWeight + actualPlateWeight;

  return {
    targetWeight,
    barWeight,
    achievedWeight,
    plates,
    totalPlateWeight: actualPlateWeight,
    isExact,
  };
}
