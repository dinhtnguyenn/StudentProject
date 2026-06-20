import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import BrushIcon from '@mui/icons-material/Brush';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';

const MASCULINE_GRADIENTS = [
  'linear-gradient(135deg, #60A5FA 0%, #1D4ED8 100%)', // Bright Blue to Deep Blue
  'linear-gradient(135deg, #38BDF8 0%, #0369A1 100%)', // Sky Blue to Ocean
  'linear-gradient(135deg, #2DD4BF 0%, #0F766E 100%)', // Bright Teal to Deep Teal
  'linear-gradient(135deg, #FB923C 0%, #C2410C 100%)', // Energetic Orange
  'linear-gradient(135deg, #34D399 0%, #047857 100%)', // Emerald Green
  'linear-gradient(135deg, #94A3B8 0%, #334155 100%)', // Tech Slate Gray
  'linear-gradient(135deg, #818CF8 0%, #3730A3 100%)', // Indigo
  'linear-gradient(135deg, #F87171 0%, #B91C1C 100%)', // Sporty Red
  'linear-gradient(135deg, #22D3EE 0%, #0E7490 100%)', // Cyan
  'linear-gradient(135deg, #A3E635 0%, #4D7C0F 100%)', // Lime Green
];

export const getFallbackConfig = (text: string = '') => {
  const m = text.toLowerCase();
  
  let Icon = CategoryIcon;
  if (m.includes('phần mềm') || m.includes('se') || m.includes('web') || m.includes('code') || m.includes('công nghệ')) Icon = CodeIcon;
  else if (m.includes('đồ hoạ') || m.includes('gd') || m.includes('design') || m.includes('mỹ thuật')) Icon = BrushIcon;
  else if (m.includes('ai') || m.includes('trí tuệ') || m.includes('data') || m.includes('dữ liệu')) Icon = PsychologyIcon;
  else if (m.includes('marketing') || m.includes('pr') || m.includes('truyền thông')) Icon = TrendingUpIcon;
  else if (m.includes('quản trị') || m.includes('kinh doanh') || m.includes('biz')) Icon = BusinessIcon;
  else if (m.includes('ngôn ngữ') || m.includes('tiếng')) Icon = SchoolIcon;
  
  // Hash string to pick a gradient index
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradientIndex = Math.abs(hash) % MASCULINE_GRADIENTS.length;
  const gradient = MASCULINE_GRADIENTS[gradientIndex];
  
  return { Icon, gradient };
};

export default function ImageWithFallback({ src, alt, fallbackText, height = 200, className, sx = {} }: { src: string, alt: string, fallbackText?: string, height?: number | string, className?: string, sx?: any }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    const { Icon, gradient } = getFallbackConfig(fallbackText || alt);
    
    return (
      <Box 
        className={className}
        sx={{ 
          height, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          background: gradient, 
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          ...sx
        }}
      >
        {/* Subtle geometric pattern */}
        <Box sx={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(20px)' }} />
        <Box sx={{ position: 'absolute', bottom: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(15px)' }} />
        <Box sx={{ position: 'absolute', top: '20%', right: '10%', width: 60, height: 60, borderRadius: '20%', background: 'rgba(255,255,255,0.03)', transform: 'rotate(45deg)' }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, zIndex: 1, p: 2 }}>
          <Box sx={{ p: 1.5, borderRadius: '20%', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)' }}>
            <Icon sx={{ fontSize: 48, opacity: 0.95 }} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.5px', textTransform: 'uppercase', color: '#FFFFFF', textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0px 2px 4px rgba(0,0,0,0.8), 0px 4px 12px rgba(0,0,0,0.6)' }}>
            {fallbackText || 'Dự án Sinh viên'}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      component="img"
      className={className}
      src={src}
      alt={alt}
      onError={() => setError(true)}
      sx={{ 
        height, 
        width: '100%', 
        objectFit: 'cover',
        display: 'block',
        ...sx
      }}
    />
  );
}
