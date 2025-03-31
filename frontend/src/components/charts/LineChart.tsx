import React from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// 註冊 ChartJS 組件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * 折線圖數據點
 */
export interface LineChartDataPoint {
  label: string;
  value: number;
}

/**
 * 折線圖數據系列
 */
export interface LineChartSeries {
  name: string;
  data: LineChartDataPoint[];
  color?: string;
  fill?: boolean;
}

/**
 * 折線圖屬性
 */
interface LineChartProps {
  title: string;
  series: LineChartSeries[];
  height?: number;
  loading?: boolean;
  error?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  animation?: boolean;
}

/**
 * 折線圖組件
 * 用於顯示時間序列數據
 */
const LineChart: React.FC<LineChartProps> = ({
  title,
  series,
  height = 300,
  loading = false,
  error,
  yAxisLabel,
  xAxisLabel,
  showLegend = true,
  showGrid = true,
  animation = true,
}) => {
  const theme = useTheme();
  const chartRef = React.useRef<ChartJS>(null);
  
  // 默認顏色
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
  ];
  
  // 準備圖表數據
  const prepareChartData = (): ChartData<'line'> => {
    // 獲取所有唯一的標籤
    const allLabels = Array.from(
      new Set(
        series.flatMap(s => s.data.map(d => d.label))
      )
    ).sort();
    
    // 為每個系列創建數據集
    const datasets = series.map((s, index) => {
      // 創建一個標籤到值的映射
      const labelValueMap = new Map(
        s.data.map(d => [d.label, d.value])
      );
      
      // 為每個標籤獲取值，如果沒有則為 null
      const values = allLabels.map(label => 
        labelValueMap.has(label) ? labelValueMap.get(label) : null
      );
      
      // 確定顏色
      const color = s.color || defaultColors[index % defaultColors.length];
      
      return {
        label: s.name,
        data: values,
        borderColor: color,
        backgroundColor: s.fill 
          ? `${color}33` // 添加透明度
          : 'transparent',
        fill: s.fill || false,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
      };
    });
    
    return {
      labels: allLabels,
      datasets,
    };
  };
  
  // 圖表選項
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animation ? undefined : false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        cornerRadius: 4,
        titleFont: {
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          size: 12,
        },
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          },
        },
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: showGrid,
          color: theme.palette.divider,
        },
        title: {
          display: !!xAxisLabel,
          text: xAxisLabel || '',
          color: theme.palette.text.secondary,
          font: {
            size: 12,
          },
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          display: showGrid,
          color: theme.palette.divider,
        },
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel || '',
          color: theme.palette.text.secondary,
          font: {
            size: 12,
          },
        },
        ticks: {
          color: theme.palette.text.secondary,
          font: {
            size: 11,
          },
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };
  
  // 渲染加載狀態
  if (loading) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          height: height, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <CircularProgress size={40} />
        </Box>
      </Paper>
    );
  }
  
  // 渲染錯誤狀態
  if (error) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          height: height, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flexGrow: 1,
            color: theme.palette.error.main,
          }}
        >
          <Typography variant="body2" color="inherit">
            {error}
          </Typography>
        </Box>
      </Paper>
    );
  }
  
  // 渲染空數據狀態
  if (!series || series.length === 0 || series.every(s => s.data.length === 0)) {
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          height: height, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flexGrow: 1,
            color: theme.palette.text.secondary,
          }}
        >
          <Typography variant="body2" color="inherit">
            無可用數據
          </Typography>
        </Box>
      </Paper>
    );
  }
  
  // 渲染圖表
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 2, 
        height: height, 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <Line 
          ref={chartRef}
          data={prepareChartData()} 
          options={options} 
        />
      </Box>
    </Paper>
  );
};

export default LineChart;