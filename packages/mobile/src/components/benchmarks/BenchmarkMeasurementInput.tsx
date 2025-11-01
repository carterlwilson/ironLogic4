import { NumberInput, TextInput, Textarea } from '@mantine/core';
import { BenchmarkType } from '@ironlogic4/shared/types/benchmarkTemplates';
import { formatTimeSeconds, parseTimeString, validateTimeString } from '../../utils/benchmarkUtils';

interface BenchmarkMeasurementInputProps {
  type: BenchmarkType;
  value: number | string | undefined;
  onChange: (value: number | string | undefined) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export function BenchmarkMeasurementInput({
  type,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
}: BenchmarkMeasurementInputProps) {
  switch (type) {
    case BenchmarkType.WEIGHT:
      return (
        <NumberInput
          label="Weight (kg)"
          placeholder="Enter weight in kilograms"
          value={value as number | undefined}
          onChange={(val) => onChange(val as number | undefined)}
          min={0}
          max={1000}
          step={0.5}
          decimalScale={2}
          error={error}
          disabled={disabled}
          required={required}
          description="Enter the weight in kilograms"
          size="lg"
        />
      );

    case BenchmarkType.TIME:
      return (
        <TextInput
          label="Time (MM:SS)"
          placeholder="MM:SS (e.g., 05:30)"
          value={
            typeof value === 'number'
              ? formatTimeSeconds(value)
              : value || ''
          }
          onChange={(event) => {
            const timeStr = event.currentTarget.value;
            if (!timeStr) {
              onChange(undefined);
              return;
            }

            // Allow typing without validation
            if (timeStr.includes(':') && validateTimeString(timeStr)) {
              try {
                const seconds = parseTimeString(timeStr);
                onChange(seconds);
              } catch {
                // Keep the string value during typing
                onChange(timeStr);
              }
            } else {
              // Keep the string value during typing
              onChange(timeStr);
            }
          }}
          error={error || (value && typeof value === 'string' && !validateTimeString(value) ? 'Invalid time format. Use MM:SS' : undefined)}
          disabled={disabled}
          required={required}
          description="Enter time in MM:SS format (e.g., 05:30 for 5 minutes 30 seconds)"
          size="lg"
        />
      );

    case BenchmarkType.REPS:
      return (
        <NumberInput
          label="Repetitions"
          placeholder="Enter number of reps"
          value={value as number | undefined}
          onChange={(val) => onChange(val as number | undefined)}
          min={0}
          max={10000}
          step={1}
          decimalScale={0}
          error={error}
          disabled={disabled}
          required={required}
          description="Enter the number of repetitions"
          size="lg"
        />
      );

    case BenchmarkType.OTHER:
      return (
        <Textarea
          label="Measurement Notes"
          placeholder="Describe your measurement..."
          value={value as string | undefined}
          onChange={(event) => onChange(event.currentTarget.value)}
          error={error}
          disabled={disabled}
          required={required}
          minRows={3}
          maxRows={6}
          description="Describe your measurement in detail"
          size="lg"
        />
      );

    default:
      return null;
  }
}