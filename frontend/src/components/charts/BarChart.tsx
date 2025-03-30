import React, { useRef, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import Chart from 'chart.js/auto';

/**
 * 圖表數據項接口
 */
interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

/**
 * 柱狀圖屬性接口
 */
interface BarChartProps {
  data: ChartDataItem[];
  horizontal?: boolean;
  showValues?: boolean;
  height?: number;
}

/**
 * 柱狀圖組件
 */
const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  horizontal = false, 
  showValues = false,
  height = 300
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const theme = useTheme();
  
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;
    
    // 銷毀舊圖表
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // 準備數據
    const labels = data.map(item => item.name);
    const values = data.map(item => item.value);
    const colors = data.map(item => item.color);
    
    // 創建圖表
    chartInstance.current = new Chart(ctx, {
      type: horizontal ? 'bar' : 'bar',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: colors.map(color => color),
            borderWidth: 1,
            borderRadius: 4,
            barThickness: horizontal ? 20 : 'flex',
            maxBarThickness: 50
          }
        ]
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: theme.palette.background.paper,
            titleColor: theme.palette.text.primary,
            bodyColor: theme.palette.text.secondary,
            borderColor: theme.palette.divider,
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                return `${context.dataset.data[context.dataIndex]}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: !horizontal,
              color: theme.palette.divider,
              drawBorder: false
            },
            ticks: {
              color: theme.palette.text.secondary,
              font: {
                size: 11
              },
              padding: 8
            }
          },
          y: {
            grid: {
              display: horizontal,
              color: theme.palette.divider,
              drawBorder: false
            },
            ticks: {
              color: theme.palette.text.secondary,
              font: {
                size: 11
              },
              padding: 8
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
    
    // 清理函數
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, horizontal, theme]);
  
  return (
    <Box sx={{ width: '100%', height }}>
      <canvas ref={chartRef} />
    </Box>
  );
};

export default BarChart;