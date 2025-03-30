import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Typography,
  Alert,
  AlertTitle,
  Paper,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationType } from '../../contexts/NotificationContext';
import knowledgeEnhancementService, {
  KnowledgeGraph as KnowledgeGraphData,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
} from '../../services/knowledgeEnhancementService';

// 引入 D3.js
// 注意：在實際項目中，需要安裝 D3.js 依賴
// npm install d3 @types/d3
import * as d3 from 'd3';

interface KnowledgeGraphProps {
  width?: number;
  height?: number;
}

/**
 * 知識圖譜組件
 * 用於可視化知識項目之間的關聯
 */
const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  width = 800,
  height = 600,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotifications();
  const svgRef = useRef<SVGSVGElement>(null);
  
  // 狀態
  const [loading, setLoading] = useState(false);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [relationTypeFilter, setRelationTypeFilter] = useState<string>('all');
  
  // 獲取知識圖譜數據
  const fetchKnowledgeGraph = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 獲取知識圖譜
      const graph = await knowledgeEnhancementService.generateKnowledgeGraph();
      
      setGraphData(graph);
      
      // 顯示通知
      if (graph.nodes.length > 0) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: t('knowledge.graph.successTitle'),
          message: t('knowledge.graph.successMessage', {
            nodes: graph.nodes.length,
            edges: graph.edges.length,
          }),
        });
      } else {
        addNotification({
          type: NotificationType.INFO,
          title: t('knowledge.graph.emptyTitle'),
          message: t('knowledge.graph.emptyMessage'),
        });
      }
    } catch (error) {
      console.error('獲取知識圖譜錯誤:', error);
      
      setError(error.message || '獲取知識圖譜時發生錯誤');
      
      addNotification({
        type: NotificationType.ERROR,
        title: t('knowledge.graph.errorTitle'),
        message: t('knowledge.graph.errorMessage'),
      });
    } finally {
      setLoading(false);
    }
  };
  
  // 初始化時獲取知識圖譜
  useEffect(() => {
    fetchKnowledgeGraph();
  }, []);
  
  // 當圖譜數據或過濾器變更時，重新渲染圖譜
  useEffect(() => {
    if (graphData && svgRef.current) {
      renderGraph();
    }
  }, [graphData, categoryFilter, relationTypeFilter]);
  
  // 獲取可用的分類列表
  const getCategories = () => {
    if (!graphData) return [];
    
    const categories = new Set<string>();
    
    graphData.nodes.forEach(node => {
      categories.add(node.category);
    });
    
    return Array.from(categories);
  };
  
  // 獲取可用的關聯類型列表
  const getRelationTypes = () => {
    if (!graphData) return [];
    
    const types = new Set<string>();
    
    graphData.edges.forEach(edge => {
      types.add(edge.type);
    });
    
    return Array.from(types);
  };
  
  // 過濾節點
  const filterNodes = () => {
    if (!graphData) return [];
    
    if (categoryFilter === 'all') {
      return graphData.nodes;
    }
    
    return graphData.nodes.filter(node => node.category === categoryFilter);
  };
  
  // 過濾邊
  const filterEdges = (filteredNodes: KnowledgeGraphNode[]) => {
    if (!graphData) return [];
    
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    let edges = graphData.edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );
    
    if (relationTypeFilter !== 'all') {
      edges = edges.filter(edge => edge.type === relationTypeFilter);
    }
    
    return edges;
  };
  
  // 渲染圖譜
  const renderGraph = () => {
    if (!graphData || !svgRef.current) return;
    
    // 清除現有的圖譜
    d3.select(svgRef.current).selectAll('*').remove();
    
    // 過濾數據
    const filteredNodes = filterNodes();
    const filteredEdges = filterEdges(filteredNodes);
    
    // 如果沒有節點，則不渲染
    if (filteredNodes.length === 0) return;
    
    // 創建 SVG 容器
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);
    
    // 定義顏色比例尺
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    // 創建力導向圖佈局
    const simulation = d3.forceSimulation(filteredNodes as any)
      .force('link', d3.forceLink(filteredEdges as any)
        .id((d: any) => d.id)
        .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));
    
    // 創建邊
    const link = svg.append('g')
      .selectAll('line')
      .data(filteredEdges)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => {
        // 根據關聯類型設置顏色
        switch (d.type) {
          case 'related':
            return '#999';
          case 'parent':
            return '#3f51b5';
          case 'child':
            return '#2196f3';
          case 'similar':
            return '#4caf50';
          case 'contradicts':
            return '#f44336';
          default:
            return '#999';
        }
      })
      .attr('stroke-width', (d: any) => 1 + d.strength * 3)
      .attr('stroke-opacity', 0.6);
    
    // 創建節點
    const node = svg.append('g')
      .selectAll('.node')
      .data(filteredNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );
    
    // 添加節點圓圈
    node.append('circle')
      .attr('r', 10)
      .attr('fill', (d: any) => colorScale(d.category))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);
    
    // 添加節點標籤
    node.append('text')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text((d: any) => d.label)
      .attr('font-size', '10px')
      .attr('font-family', 'sans-serif');
    
    // 添加標題提示
    node.append('title')
      .text((d: any) => `${d.label}\n${t('knowledge.graph.category')}: ${d.category}\n${t('knowledge.graph.tags')}: ${d.tags.join(', ')}`);
    
    // 更新力導向圖佈局
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      
      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
    
    // 拖拽開始
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    // 拖拽中
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    // 拖拽結束
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };
  
  return (
    <Card variant="outlined">
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountTreeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              {t('knowledge.graph.title')}
            </Typography>
          </Box>
        }
        subheader={t('knowledge.graph.description')}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            onClick={fetchKnowledgeGraph}
            disabled={loading}
          >
            {t('common.refresh')}
          </Button>
        }
      />
      
      <Divider />
      
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>{t('knowledge.graph.errorTitle')}</AlertTitle>
            {error}
          </Alert>
        )}
        
        {graphData && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{t('knowledge.graph.categoryFilter')}</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label={t('knowledge.graph.categoryFilter')}
                >
                  <MenuItem value="all">{t('common.all')}</MenuItem>
                  {getCategories().map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>{t('knowledge.graph.relationTypeFilter')}</InputLabel>
                <Select
                  value={relationTypeFilter}
                  onChange={(e) => setRelationTypeFilter(e.target.value)}
                  label={t('knowledge.graph.relationTypeFilter')}
                >
                  <MenuItem value="all">{t('common.all')}</MenuItem>
                  {getRelationTypes().map((type) => (
                    <MenuItem key={type} value={type}>
                      {t(`knowledge.organization.relationType.${type}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              <Typography variant="caption" sx={{ mr: 1, alignSelf: 'center' }}>
                {t('knowledge.graph.legend')}:
              </Typography>
              
              {getCategories().map((category) => (
                <Chip
                  key={category}
                  label={category}
                  size="small"
                  sx={{
                    bgcolor: d3.scaleOrdinal(d3.schemeCategory10)(category),
                    color: 'white',
                  }}
                />
              ))}
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('knowledge.graph.stats', {
                nodes: graphData.nodes.length,
                edges: graphData.edges.length,
              })}
            </Typography>
          </Box>
        )}
        
        {loading && !graphData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : graphData && graphData.nodes.length === 0 ? (
          <Alert severity="info">
            {t('knowledge.graph.emptyMessage')}
          </Alert>
        ) : (
          <Paper
            variant="outlined"
            sx={{
              width: '100%',
              height: height,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <svg ref={svgRef} width={width} height={height} />
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default KnowledgeGraph;