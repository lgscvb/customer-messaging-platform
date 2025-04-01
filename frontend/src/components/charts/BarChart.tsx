import * as React from 'react';
import { Box, Typography, Paper, CircularProgress, Alert } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Chart from 'chart.js/auto';

/**
 * 圖表數據項接口
 */
interface ChartDataItem {
  label: string;
  value: number;
}

/**
 * 柱狀圖數據系列接口
 */
export interface BarChartSeries {
  name: string;
  data: ChartDataItem[];
  color?: string;
}

/**
 * 柱狀圖屬性接口
 */
interface BarChartProps {
  title?: string;
  series: BarChartSeries[];
  height?: number;
  horizontal?: boolean;
  // 移除 showValues 替換為更精確的參數名稱
  showValues?: boolean; // @deprecated 使用 _showValues 替代
  _showValues?: boolean; // 暫時未使用，保留給未來擴展功能
  loading?: boolean;
  error?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

/**
 * 柱狀圖組件
 */
const BarChart: React.FC<BarChartProps> = ({
  title,
  series,
  height = 300,
  horizontal = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _showValues = false, // 暫時未使用，但保留此參數以供未來使用
  loading = false,
  error,
  yAxisLabel,
  xAxisLabel
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const theme = useTheme();
  
  useEffect(() => {
    if (!chartRef.current || loading || error || series.length === 0) return;
    
    // 銷毀舊圖表
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    // 準備數據
    const allLabels = series[0].data.map(item => item.label);
    
    const datasets = series.map((s, index) => {
      const color = s.color || getDefaultColor(index, theme);
      
      return {
        label: s.name,
        data: s.data.map(item => item.value),
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
        barThickness: horizontal ? 20 : 'flex',
        maxBarThickness: 50
      };
    });
    
    // 創建圖表
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: allLabels,
        datasets
      },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: series.length > 1,
            position: 'top',
            align: 'end',
            labels: {
              color: theme.palette.text.secondary,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              boxWidth: 8,
              boxHeight: 8,
              font: {
                size: 11
              }
            }
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
                const label = context.dataset.label || '';
                const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed.x;
                return `${label}: ${value}`;
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
            },
            title: {
              display: !!xAxisLabel,
              text: xAxisLabel || '',
              color: theme.palette.text.secondary,
              font: {
                size: 12,
                weight: 'normal'
              },
              padding: { top: 10 }
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
            },
            title: {
              display: !!yAxisLabel,
              text: yAxisLabel || '',
              color: theme.palette.text.secondary,
              font: {
                size: 12,
                weight: 'normal'
              },
              padding: { bottom: 10 }
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
  }, [series, horizontal, loading, error, theme, yAxisLabel, xAxisLabel]);
  
  // 獲取默認顏色
  const getDefaultColor = (index: number, theme: ReturnType<typeof useTheme>): string => {
    const colors = [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.info.main,
      theme.palette.warning.main,
      theme.palette.error.main
    ];
    
    return colors[index % colors.length];
  };
  
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      {title && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        ) : series.length === 0 ? (
          <Typography color="text.secondary">
            無可用數據
          </Typography>
        ) : (
          <Box sx={{ width: '100%', height: '100%', minHeight: height }}>
            <canvas ref={chartRef} />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default BarChart;