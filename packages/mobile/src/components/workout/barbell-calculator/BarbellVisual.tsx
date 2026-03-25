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
 * SVG visualization of one side of a loaded barbell.
 *
 * Renders (left to right):
 * - Bar stub on the left (inside/center of bar)
 * - Plates ordered from heaviest (inside) to lightest (outside)
 * - Plate collar/clamp at the far right (outside end)
 */
export function BarbellVisual({ calculation }: BarbellVisualProps) {
  // SVG dimensions
  const height = 200;
  const barHeight = 20;
  const barY = height / 2 - barHeight / 2;
  const barX = 20;
  const barLength = 180;

  // Plate dimensions
  const plateBaseHeight = 100;
  const plateMinWidth = 8;
  const plateMaxWidth = 20;
  const plateGap = 2;
  const collarWidth = 8;
  const collarHeight = Math.round(plateBaseHeight / 8); // ~12px

  // Stagger offsets for plate labels to avoid overlap on narrow plates
  const labelOffsets = [-30, -15, 0, 15, 30];

  // Calculate plate widths proportional to weight (25kg = max width, 1.25kg = min width)
  const getPlateWidth = (weight: number): number => {
    const minWeight = 1.25;
    const maxWeight = 25;
    const ratio = (weight - minWeight) / (maxWeight - minWeight);
    return plateMinWidth + ratio * (plateMaxWidth - plateMinWidth);
  };

  // Compute total width of all plates on one side
  const totalPlateWidth = calculation.plates.reduce(
    (sum, p) => sum + p.quantity * (getPlateWidth(p.weight) + plateGap),
    0
  );

  // Dynamic viewBox width: bar stub + plates + collar + right padding
  const totalWidth = barX + barLength + totalPlateWidth + collarWidth + 20;

  // Render plates stacking rightward from startX
  const renderPlates = (startX: number) => {
    let currentX = startX;
    let renderIndex = 0;

    return calculation.plates.flatMap((plate, plateIndex) => {
      const plateWidth = getPlateWidth(plate.weight);
      const plateHeight = plate.weight <= 5 ? plateBaseHeight / 2 : plateBaseHeight;
      const plateY = height / 2 - plateHeight / 2;

      return Array.from({ length: plate.quantity }, (_, quantityIndex) => {
        const x = currentX;
        const rawLabelY = height / 2 + labelOffsets[renderIndex % labelOffsets.length];
        const labelY = Math.max(plateY + 8, Math.min(plateY + plateHeight - 8, rawLabelY));
        const plateElement = (
          <g key={`${plateIndex}-${quantityIndex}`}>
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
            <text
              x={x + plateWidth / 2}
              y={labelY}
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

        currentX = currentX + plateWidth + plateGap;
        renderIndex++;
        return plateElement;
      });
    });
  };

  // Render the plate collar/clamp at the outside end
  const renderCollar = (x: number) => {
    const collarY = height / 2 - collarHeight / 2;
    return (
      <g key="collar">
        {/* Collar body */}
        <rect
          x={x}
          y={collarY}
          width={collarWidth}
          height={collarHeight}
          fill="#1F2937"
          stroke="#111827"
          strokeWidth={1}
          rx={1}
        />
      </g>
    );
  };

  const platesStartX = barX + barLength;
  const collarX = platesStartX + totalPlateWidth;

  return (
    <Paper p="md" radius="md" withBorder bg="gray.0">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Bar stub (inside/center portion) */}
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

        {/* Bar weight label */}
        <text
          x={barX + barLength / 2}
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

        {/* Plates stacking outward */}
        {calculation.plates.length > 0 && renderPlates(platesStartX)}

        {/* Collar/clamp at outside end */}
        {renderCollar(collarX)}
      </svg>
    </Paper>
  );
}
