import { useMemo, useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Box, useTheme, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Project } from '../types/Project';

interface TechNetworkGraphProps {
  projects: Project[];
  onTechClick: (tech: string) => void;
  onClose: () => void;
}

export default function TechNetworkGraph({ projects, onTechClick, onClose }: TechNetworkGraphProps) {
  const theme = useTheme();
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize observer to make graph responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const techMap = new Map<string, number>();

    projects.forEach(p => {
      if (p.techTags && p.techTags.length > 0) {
        p.techTags.forEach((t: string) => {
          techMap.set(t, (techMap.get(t) || 0) + 1);
          links.push({ source: p.id, target: t });
        });
      }
    });

    techMap.forEach((count, tech) => {
      nodes.push({
        id: tech,
        name: tech,
        group: 'tech',
        val: Math.min(count * 3 + 5, 25), // Size based on frequency
      });
    });

    projects.forEach(p => {
      // Only include projects that have tags, otherwise they float disconnected
      if (p.techTags && p.techTags.length > 0) {
        nodes.push({
          id: p.id,
          name: p.name,
          group: 'project',
          val: 2,
        });
      }
    });

    return { nodes, links };
  }, [projects]);

  const handleNodeClick = (node: any) => {
    if (node.group === 'tech') {
      onTechClick(node.name);
      onClose(); // Auto close after picking
    }
  };

  // Node paint function to make it look cool
  const paintNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = node.group === 'tech' ? Math.max(12 / globalScale, 4) : Math.max(8 / globalScale, 2);
    ctx.font = `${fontSize}px Inter, sans-serif`;
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
    
    if (node.group === 'tech') {
      ctx.fillStyle = theme.palette.mode === 'dark' ? '#3B82F6' : '#2563EB'; // Blue
      ctx.fill();
      ctx.strokeStyle = theme.palette.mode === 'dark' ? '#93C5FD' : '#BFDBFE';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();
    } else {
      ctx.fillStyle = theme.palette.mode === 'dark' ? '#475569' : '#CBD5E1'; // Slate
      ctx.fill();
    }

    // Draw text
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Text background
    if (node.group === 'tech') {
      ctx.fillStyle = theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - node.val - fontSize - 2, bckgDimensions[0], bckgDimensions[1]);
      ctx.fillStyle = theme.palette.mode === 'dark' ? '#FFF' : '#1E293B';
      ctx.fillText(label, node.x, node.y - node.val - fontSize / 2 - 2);
    } else {
      // Show project text only if zoomed in enough
      if (globalScale > 1.5) {
        ctx.fillStyle = theme.palette.text.secondary;
        ctx.fillText(label, node.x, node.y + node.val + fontSize / 2 + 2);
      }
    }
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      bgcolor: theme.palette.mode === 'dark' ? '#0F172A' : '#F8FAFC',
      borderRadius: 4,
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        position: 'absolute', top: 0, left: 0, right: 0, 
        p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: theme.palette.mode === 'dark' ? 'linear-gradient(to bottom, rgba(15,23,42,0.9), transparent)' : 'linear-gradient(to bottom, rgba(248,250,252,0.9), transparent)',
        zIndex: 10
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Sơ đồ Mạng lưới Công nghệ</Typography>
          <Typography variant="body2" color="text.secondary">Kéo thả các node hoặc Click vào một Công nghệ để lọc dự án</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box ref={containerRef} sx={{ width: '100%', height: '100%' }}>
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel={() => ''} // Disable default tooltip since we draw text
          nodeCanvasObject={paintNode}
          linkColor={() => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.2)'}
          linkWidth={1}
          onNodeClick={handleNodeClick}
          cooldownTicks={100}
          onEngineStop={() => {
            if (graphRef.current) {
              graphRef.current.zoomToFit(400, 50);
            }
          }}
        />
      </Box>
    </Box>
  );
}
