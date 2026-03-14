import { useEffect, useState } from 'react';
import { Paper, Text, Loader, Stack, Center, Box } from '@mantine/core';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getBenchmarkProgress } from '../../services/benchmarkApi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const PALETTE = [
  '#228be6',
  '#40c057',
  '#fa5252',
  '#fd7e14',
  '#be4bdb',
  '#15aabf',
];

interface BenchmarkProgressChartProps {
  templateId: string;
  benchmarkName: string;
}

export const BenchmarkProgressChart = ({ templateId }: BenchmarkProgressChartProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<Array<Record<string, any>>>([]);
  const [series, setSeries] = useState<Array<{ name: string; label: string }>>([]);
  const [unit, setUnit] = useState<string>('');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getBenchmarkProgress(templateId);
        setChartData(data.chartData);
        setSeries(data.series);
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

  const data = {
    labels: chartData.map(row => row.date as string),
    datasets: series.map((s, i) => ({
      label: s.label,
      data: chartData.map(row => {
        const v = row[s.name];
        return v != null ? (v as number) : null;
      }),
      borderColor: PALETTE[i % PALETTE.length],
      backgroundColor: PALETTE[i % PALETTE.length] + '33',
      tension: 0,
      spanGaps: true,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 16,
          font: { size: 13 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.y} ${unit}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          font: { size: 11 },
          autoSkip: true,
          maxTicksLimit: 8,
        },
        grid: { display: false },
      },
      y: {
        title: {
          display: !!unit,
          text: unit,
          font: { size: 12 },
        },
        ticks: { font: { size: 11 } },
        beginAtZero: false,
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  return (
    <Stack gap="xs">
      <Box style={{ position: 'relative', height: 250 }}>
        <Line data={data} options={options} />
      </Box>
    </Stack>
  );
};
