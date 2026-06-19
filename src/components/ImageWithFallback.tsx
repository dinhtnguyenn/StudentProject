import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import BrushIcon from '@mui/icons-material/Brush';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BusinessIcon from '@mui/icons-material/Business';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';

const MAJOR_COLORS = [
  '#4F46E5', // Indigo
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#EF4444', // Red
];

export const getMajorConfig = (major: string = '') => {
  const m = major.toLowerCase();
  
  let Icon = CategoryIcon;
  if (m.includes('phần mềm') || m.includes('se') || m.includes('web') || m.includes('code')) Icon = CodeIcon;
  else if (m.includes('đồ hoạ') || m.includes('gd') || m.includes('design') || m.includes('mỹ thuật')) Icon = BrushIcon;
  else if (m.includes('ai') || m.includes('trí tuệ') || m.includes('data') || m.includes('dữ liệu')) Icon = PsychologyIcon;
  else if (m.includes('marketing') || m.includes('pr') || m.includes('truyền thông')) Icon = TrendingUpIcon;
  else if (m.includes('quản trị') || m.includes('kinh doanh') || m.includes('biz')) Icon = BusinessIcon;
  else if (m.includes('ngôn ngữ') || m.includes('tiếng')) Icon = SchoolIcon;
  
  // Hash string to pick a color
  let hash = 0;
  for (let i = 0; i < major.length; i++) {
    hash = major.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % MAJOR_COLORS.length;
  
  return { Icon, color: MAJOR_COLORS[colorIndex] };
};

export default function ImageWithFallback({ src, alt, major, height = 200, className, sx = {} }: { src: string, alt: string, major?: string, height?: number | string, className?: string, sx?: any }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    const { Icon, color } = getMajorConfig(major || alt);
    
    return (
      <Box 
        className={className}
        sx={{ 
          height, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          bgcolor: color, 
          color: 'white',
          gap: 1,
          ...sx
        }}
      >
        <Icon sx={{ fontSize: 64, opacity: 0.9 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, opacity: 0.9, px: 2, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {major || 'Dự án Sinh viên'}
        </Typography>
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
