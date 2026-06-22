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
    const isTech = node.group === 'tech';
    const fontSize = isTech ? Math.max(12 / globalScale, 4) : Math.max(8 / globalScale, 2);
    ctx.font = `${fontSize}px Inter, sans-serif`;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isTech) {
      const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
      const colorHash = Math.abs(label.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0)) % colors.length;
      const nodeColor = colors[colorHash];

      const textWidth = ctx.measureText(label).width;
      const paddingX = fontSize * 0.8;
      const paddingY = fontSize * 0.5;
      const boxWidth = textWidth + paddingX * 2;
      const boxHeight = fontSize + paddingY * 2;

      // Draw rounded rect (pill shape)
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.roundRect(node.x - boxWidth / 2, node.y - boxHeight / 2, boxWidth, boxHeight, boxHeight / 2);
      ctx.fill();

      ctx.strokeStyle = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(label, node.x, node.y);

      // Store dimensions for hit testing if needed
      node.__bckgDimensions = [boxWidth, boxHeight];
    } else {
      // Project node: small circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
      ctx.fillStyle = theme.palette.mode === 'dark' ? '#94A3B8' : '#CBD5E1';
      ctx.fill();

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
      bgcolor: theme.palette.mode === 'dark' ? '#000000' : '#F8FAFC',
      backgroundImage: theme.palette.mode === 'dark'
        ? 'radial-gradient(circle at center, #0A0A0A 0%, #000000 100%)'
        : 'radial-gradient(circle at center, #FFFFFF 0%, #F8FAFC 100%)',
      borderRadius: 4,
      overflow: 'hidden'
    }}>
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0,
        p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        zIndex: 10
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            Sơ đồ công nghệ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Kéo thả các Node để tương tác. Click vào công nghệ để lọc các dự án.
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ bgcolor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', '&:hover': { bgcolor: 'error.main', color: '#FFF' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box ref={containerRef} sx={{ width: '100%', height: '100%' }}>
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel={() => ''}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            if (node.group === 'tech' && node.__bckgDimensions) {
              ctx.fillStyle = color;
              const [w, h] = node.__bckgDimensions;
              ctx.fillRect(node.x - w / 2, node.y - h / 2, w, h);
            } else {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
              ctx.fill();
            }
          }}
          linkColor={() => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.15)'}
          linkWidth={1.5}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleColor={() => theme.palette.mode === 'dark' ? '#60A5FA' : '#3B82F6'}
          onNodeClick={handleNodeClick}
          cooldownTicks={100}
          onEngineStop={() => {
            if (graphRef.current) {
              graphRef.current.zoomToFit(600, 50);
            }
          }}
        />
      </Box>
    </Box>
  );
}
