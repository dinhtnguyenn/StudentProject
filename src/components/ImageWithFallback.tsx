import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { getCurrentSeason } from '../lib/seasonalEngine';
import { getSeasonWatermark } from './SeasonalEffects';

const MAJOR_ASSETS_3D = {
  WEB: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Globe%20with%20meridians/3D/globe_with_meridians_3d.png")`,
  GAME: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Video%20game/3D/video_game_3d.png")`,
  AI: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Brain/3D/brain_3d.png")`,
  MOBILE: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Mobile%20phone/3D/mobile_phone_3d.png")`,
  DEFAULT: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/File%20folder/3D/file_folder_3d.png")`,
};

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
  
  let fallback3dUrl = MAJOR_ASSETS_3D.DEFAULT;
  if (m.includes('web') || m.includes('website')) fallback3dUrl = MAJOR_ASSETS_3D.WEB;
  else if (m.includes('game') || m.includes('trò chơi')) fallback3dUrl = MAJOR_ASSETS_3D.GAME;
  else if (m.includes('ai') || m.includes('trí tuệ') || m.includes('data')) fallback3dUrl = MAJOR_ASSETS_3D.AI;
  else if (m.includes('mobile') || m.includes('app') || m.includes('di động') || m.includes('ứng dụng')) fallback3dUrl = MAJOR_ASSETS_3D.MOBILE;
  
  // Hash string to pick a gradient index
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradientIndex = Math.abs(hash) % MASCULINE_GRADIENTS.length;
  const gradient = MASCULINE_GRADIENTS[gradientIndex];
  
  return { fallback3dUrl, gradient };
};

export default function ImageWithFallback({ src, alt, fallbackText, iconKeyword, height = 200, className, sx = {} }: { src: string, alt: string, fallbackText?: string, iconKeyword?: string, height?: number | string, className?: string, sx?: any }) {
  const [error, setError] = useState(false);
  const season = getCurrentSeason();
  const seasonWatermarkUrl = season.id !== 'NONE' ? getSeasonWatermark(season.id) : null;

  if (!src || error) {
    const { fallback3dUrl, gradient } = getFallbackConfig(iconKeyword || fallbackText || alt);
    const finalIconUrl = seasonWatermarkUrl || fallback3dUrl;
    
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
            <Box sx={{ 
              width: 48, 
              height: 48, 
              backgroundImage: finalIconUrl,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }} />
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
