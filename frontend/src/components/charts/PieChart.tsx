import React, { useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  useTheme, 
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// 註冊 ChartJS 組件
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

/**
 * 餅圖數據項
 */
export interface PieChartDataItem {
  label: string;
  value: number;
  color?: string;
}

/**
 * 餅圖屬性
 */
interface PieChartProps {
  title: string;
  data: PieChartDataItem[];
  height?: number;
  loading?: boolean;
  error?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  showPercentage?: boolean;
  donut?: boolean;
  animation?: boolean;
}

/**
 * 餅圖組件
 * 用於顯示分佈數據
 */
const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  height = 300,
  loading = false,
  error,
  showLegend = true,
  showLabels = true,
  showPercentage = true,
  donut = false,
  animation = true,
}) => {
  const theme = useTheme();
  const chartRef = useRef<ChartJS>(null);
  
  // 默認顏色
  const defaultColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff8042',
    '#a4de6c',
    '#d0ed57',
  ];
  
  // 準備圖表數據
  const prepareChartData = (): ChartData<'pie'> => {
    const labels = data.map(item => item.label);
    const values = data.map(item => item.value);
    const colors = data.map((item, index) => 
      item.color || defaultColors[index % defaultColors.length]
    );
    
    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(color => `${color}99`), // 稍微透明的邊框
          borderWidth: 1,
        },
      ],
    };
  };
  
  // 計算總和
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // 圖表選項
  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animation ? undefined : false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
          },
          color: theme.palette.text.primary,
        },
      },
      tooltip: {
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
            const label = context.label || '';
            const value = context.raw as number;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            
            if (showPercentage) {
              return `${label}: ${value} (${percentage}%)`;
            } else {
              return `${label}: ${value}`;
            }
          },
        },
      },
    },
    cutout: donut ? '60%' : undefined,
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
  if (!data || data.length === 0 || data.every(item => item.value === 0)) {
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
        <Pie 
          ref={chartRef}
          data={prepareChartData()} 
          options={options} 
        />
      </Box>
      
      {/* 可選的數據表格 */}
      {showLabels && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={1}>
            {data.map((item, index) => {
              const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const color = item.color || defaultColors[index % defaultColors.length];
              
              return (
                <Grid item xs={6} sm={4} key={index}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box 
                      sx={{ 
                        width: 12, 
                        height: 12, 
                        borderRadius: '50%', 
                        backgroundColor: color,
                        mr: 1 
                      }} 
                    />
                    <Typography variant="caption" noWrap sx={{ maxWidth: '80%' }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ pl: 3 }}>
                    {item.value} {showPercentage && `(${percentage}%)`}
                  </Typography>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default PieChart;