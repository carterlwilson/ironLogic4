import { useEffect, useState } from 'react';
import { Paper, Text, Loader, Stack, Center } from '@mantine/core';
import { LineChart } from '@mantine/charts';
import { getBenchmarkProgress } from '../../services/benchmarkApi';

interface BenchmarkProgressChartProps {
  templateId: string;
  benchmarkName: string;
}

export const BenchmarkProgressChart = ({ templateId }: BenchmarkProgressChartProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<Array<{ date: string; value: number }>>([]);
  const [unit, setUnit] = useState('');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBenchmarkProgress(templateId);
        setChartData(data.chartData);
        setUnit(data.unit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [templateId]);

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (error) {
    return (
      <Paper p="md" withBorder>
        <Text c="red" size="sm">
          {error}
        </Text>
      </Paper>
    );
  }

  if (chartData.length === 0) {
    return (
      <Paper p="md" withBorder>
        <Text c="dimmed" size="sm" ta="center">
          No progress data yet
        </Text>
      </Paper>
    );
  }

  return (
    <Stack gap="xs">
      <LineChart
        h={250}
        data={chartData}
        dataKey="date"
        series={[{ name: 'value', label: unit }]}
        withLegend
        curveType="linear"
      />
    </Stack>
  );
};
