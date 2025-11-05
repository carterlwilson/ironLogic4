import { Paper } from '@mantine/core';
import { BarbellCalculation } from '../../../types/barbell';

interface BarbellVisualProps {
  calculation: BarbellCalculation;
}

/**
 * Helper function to darken a color for border/outline
 */
function darkenColor(color: string, percent: number = 20): string {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Darken by percentage
  const darkenAmount = percent / 100;
  const newR = Math.round(r * (1 - darkenAmount));
  const newG = Math.round(g * (1 - darkenAmount));
  const newB = Math.round(b * (1 - darkenAmount));

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * SVG visualization of a loaded barbell
 *
 * Renders:
 * - Bar in the center
 * - Plates on both sides
 * - Plates ordered from heaviest (inside) to lightest (outside)
 * - Plate widths proportional to weight
 * - Labels on each plate
 */
export function BarbellVisual({ calculation }: BarbellVisualProps) {
  // SVG dimensions
  const width = 800;
  const height = 200;
  const barHeight = 20;
  const barY = height / 2 - barHeight / 2;
  const barLength = 500;
  const barX = (width - barLength) / 2;

  // Plate dimensions - base size with proportional scaling
  const plateBaseHeight = 100;
  const plateMinWidth = 8;
  const plateMaxWidth = 20;

  // Calculate plate widths proportional to weight (25kg = max width, 1.25kg = min width)
  const getPlateWidth = (weight: number): number => {
    const minWeight = 1.25;
    const maxWeight = 25;
    const ratio = (weight - minWeight) / (maxWeight - minWeight);
    return plateMinWidth + ratio * (plateMaxWidth - plateMinWidth);
  };

  // Generate plates for one side (will be mirrored for the other side)
  const renderPlatesOneSide = (startX: number, direction: 'left' | 'right') => {
    let currentX = startX;
    const plateGap = 2;

    return calculation.plates.flatMap((plate, plateIndex) => {
      const plateWidth = getPlateWidth(plate.weight);
      const plateHeight = plateBaseHeight;
      const plateY = height / 2 - plateHeight / 2;

      return Array.from({ length: plate.quantity }, (_, quantityIndex) => {
        const x = direction === 'right' ? currentX : currentX - plateWidth;
        const plateElement = (
          <g key={`${plateIndex}-${quantityIndex}`}>
            {/* Plate rectangle */}
            <rect
              x={x}
              y={plateY}
              width={plateWidth}
              height={plateHeight}
              fill={plate.color}
              stroke={plate.color === '#FFFFFF' ? '#D1D5DB' : darkenColor(plate.color)}
              strokeWidth={2}
              rx={2}
            />
            {/* Plate label */}
            <text
              x={x + plateWidth / 2}
              y={height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={plate.color === '#FFFFFF' ? '#000000' : '#FFFFFF'}
              fontSize={plate.weight >= 10 ? '12' : '10'}
              fontWeight="600"
              style={{ userSelect: 'none' }}
            >
              {plate.label}
            </text>
          </g>
        );

        currentX = direction === 'right' ? currentX + plateWidth + plateGap : currentX - plateWidth - plateGap;

        return plateElement;
      });
    });
  };

  return (
    <Paper p="md" radius="md" withBorder bg="gray.0">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Left plates (render in reverse order so heaviest is closest to bar) */}
        {calculation.plates.length > 0 && renderPlatesOneSide(barX, 'left')}

        {/* Bar */}
        <rect
          x={barX}
          y={barY}
          width={barLength}
          height={barHeight}
          fill="#4B5563"
          stroke="#1F2937"
          strokeWidth={2}
          rx={4}
        />

        {/* Bar label */}
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#FFFFFF"
          fontSize="14"
          fontWeight="700"
          style={{ userSelect: 'none' }}
        >
          {calculation.barWeight}kg
        </text>

        {/* Right plates */}
        {calculation.plates.length > 0 && renderPlatesOneSide(barX + barLength, 'right')}
      </svg>
    </Paper>
  );
}
