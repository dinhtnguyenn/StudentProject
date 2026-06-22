import { useEffect, useState, useCallback } from 'react';
import { getCurrentSeason } from '../lib/seasonalEngine';
import type { SeasonId } from '../lib/seasonalEngine';

/* ──────────────────────────────────────────────────────────────
   3D Fluent Emoji Renderers
   ────────────────────────────────────────────────────────────── */

export const ASSETS_3D = {
  BAT: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Bat/3D/bat_3d.png")`,
  CHERRY_BLOSSOM: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Cherry%20blossom/3D/cherry_blossom_3d.png")`,
  LANTERN: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Red%20paper%20lantern/3D/red_paper_lantern_3d.png")`,
  SNOWFLAKE: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Snowflake/3D/snowflake_3d.png")`,
  GRADUATION_CAP: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Graduation%20cap/3D/graduation_cap_3d.png")`,
  LOTUS: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Lotus/3D/lotus_3d.png")`,
  WATERMELON: `url("https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Watermelon/3D/watermelon_3d.png")`,
};

export const getSeasonWatermark = (seasonId: string) => {
  switch (seasonId) {
    case 'XMAS': return ASSETS_3D.SNOWFLAKE;
    case 'TET': return ASSETS_3D.CHERRY_BLOSSOM;
    case 'CULTURE': return ASSETS_3D.LOTUS;
    case 'HALLOWEEN': return ASSETS_3D.BAT;
    case 'HUNG_KING': return ASSETS_3D.WATERMELON;
    case 'MID_AUTUMN': return ASSETS_3D.LANTERN;
    case 'TEACHER': return ASSETS_3D.GRADUATION_CAP;
    default: return null;
  }
};

interface ParticleConfig {
  count: number;
  anim: string;
  speed: [number, number]; // [min, max] seconds
  sizeRange: [number, number]; // [min, max] rem
  opacity: [number, number];
  images: string[]; // Array of image URLs to randomly pick from
  style: React.CSSProperties;
}

const SEASON_PARTICLES: Partial<Record<SeasonId, ParticleConfig>> = {
  XMAS: {
    count: 25,
    anim: 'seasonSnow',
    speed: [10, 20],
    sizeRange: [0.8, 1.5],
    opacity: [0.6, 1.0],
    images: [ASSETS_3D.SNOWFLAKE],
    style: { filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' },
  },
  TET: {
    count: 20,
    anim: 'seasonPetalDrift',
    speed: [12, 22],
    sizeRange: [1.0, 2.0],
    opacity: [0.7, 1.0],
    images: [ASSETS_3D.CHERRY_BLOSSOM],
    style: { filter: 'drop-shadow(0 4px 12px rgba(236, 72, 153, 0.2))' },
  },
  CULTURE: {
    count: 15,
    anim: 'seasonFloat',
    speed: [12, 22],
    sizeRange: [1.5, 2.5],
    opacity: [0.7, 1.0],
    images: [ASSETS_3D.LOTUS],
    style: { filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' },
  },
  HALLOWEEN: {
    count: 15,
    anim: 'seasonBatFlight',
    speed: [6, 12],
    sizeRange: [1.5, 2.5],
    opacity: [0.7, 1.0],
    images: [ASSETS_3D.BAT],
    style: { filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' },
  },
  HUNG_KING: {
    count: 12,
    anim: 'seasonFloat',
    speed: [15, 25],
    sizeRange: [2.0, 3.5],
    opacity: [0.6, 0.9],
    images: [ASSETS_3D.WATERMELON],
    style: { filter: 'drop-shadow(0 8px 24px rgba(217, 119, 6, 0.3))' },
  },
  MID_AUTUMN: {
    count: 12,
    anim: 'seasonRiseFloat',
    speed: [12, 24],
    sizeRange: [1.8, 3.0],
    opacity: [0.8, 1.0],
    images: [ASSETS_3D.LANTERN],
    style: {
      filter: 'drop-shadow(0 0 20px rgba(245, 158, 11, 0.6))'
    },
  },
  TEACHER: {
    count: 10,
    anim: 'seasonFly',
    speed: [8, 14],
    sizeRange: [1.5, 2.5],
    opacity: [0.7, 1.0],
    images: [ASSETS_3D.GRADUATION_CAP],
    style: { filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' },
  }
};

/* ──────────────────────────────────────────────────────────────
   Keyframes
   ────────────────────────────────────────────────────────────── */
const globalStyles = `
  @keyframes seasonSnow {
    0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    50% { transform: translateY(45vh) translateX(20px) rotate(180deg); }
    90% { opacity: 1; }
    100% { transform: translateY(110vh) translateX(-20px) rotate(360deg); opacity: 0; }
  }
  @keyframes seasonPetalDrift {
    0% { transform: translateY(-10vh) translateX(0) rotate(0deg) scale(0.8); opacity: 0; }
    20% { opacity: 1; }
    50% { transform: translateY(45vh) translateX(30px) rotate(180deg) scale(1); }
    80% { opacity: 1; }
    100% { transform: translateY(110vh) translateX(-30px) rotate(360deg) scale(0.8); opacity: 0; }
  }
  @keyframes seasonEmberRise {
    0% { transform: translateY(110vh) translateX(0) rotate(0deg) scale(0.8); opacity: 0; }
    20% { opacity: 1; }
    50% { transform: translateY(45vh) translateX(-20px) rotate(-10deg) scale(1.2); }
    80% { opacity: 1; }
    100% { transform: translateY(-10vh) translateX(20px) rotate(10deg) scale(0.8); opacity: 0; }
  }
  @keyframes seasonFloat {
    0% { transform: translateY(110vh) translateX(0); opacity: 0; }
    25% { opacity: 1; transform: translateY(75vh) translateX(15px); }
    50% { transform: translateY(50vh) translateX(-15px); }
    75% { opacity: 1; transform: translateY(25vh) translateX(15px); }
    100% { transform: translateY(-10vh) translateX(0); opacity: 0; }
  }
  @keyframes seasonBatFlight {
    0% { transform: translateY(110vh) translateX(0) scale(0.8) rotate(15deg); opacity: 0; }
    20% { opacity: 1; transform: translateY(80vh) translateX(30px) scale(1) rotate(-10deg); }
    40% { transform: translateY(50vh) translateX(-20px) scale(1.1) rotate(20deg); }
    60% { transform: translateY(20vh) translateX(40px) scale(0.9) rotate(-15deg); }
    80% { opacity: 1; transform: translateY(-10vh) translateX(-10px) scale(1) rotate(10deg); }
    100% { transform: translateY(-30vh) translateX(0) scale(0.8); opacity: 0; }
  }
  @keyframes seasonRiseFloat {
    0% { transform: translateY(110vh) translateX(0) rotate(0deg); opacity: 0; }
    25% { opacity: 1; transform: translateY(75vh) translateX(20px) rotate(-5deg); }
    50% { transform: translateY(50vh) translateX(-15px) rotate(5deg); }
    75% { opacity: 1; transform: translateY(25vh) translateX(15px) rotate(-3deg); }
    100% { transform: translateY(-15vh) translateX(0) rotate(0deg); opacity: 0; }
  }
  @keyframes seasonFly {
    0% { transform: translateY(30vh) translateX(-20vw) rotate(15deg); opacity: 0; }
    20% { opacity: 1; }
    100% { transform: translateY(-10vh) translateX(120vw) rotate(15deg); opacity: 0; }
  }
`;

export default function SeasonalEffects() {
  const [season, setSeason] = useState(getCurrentSeason());
  const [particles, setParticles] = useState<any[]>([]);

  // Force re-check when URL changes (for dev overriding)
  useEffect(() => {
    const handlePopState = () => setSeason(getCurrentSeason());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const config = SEASON_PARTICLES[season.id];

  const generateParticles = useCallback(() => {
    if (!config) {
      setParticles([]);
      return;
    }
    const newParticles = [];
    for (let i = 0; i < config.count; i++) {
      // Randomize values
      const left = Math.random() * 100; // 0-100%
      const top = Math.random() * 100; // For Fly/Float starting positions
      const animDuration = Math.random() * (config.speed[1] - config.speed[0]) + config.speed[0];
      const delay = Math.random() * -20; // negative delay so they start immediately at different stages
      const size = Math.random() * (config.sizeRange[1] - config.sizeRange[0]) + config.sizeRange[0];
      const targetOpacity = Math.random() * (config.opacity[1] - config.opacity[0]) + config.opacity[0];
      
      const imageUrl = config.images[Math.floor(Math.random() * config.images.length)];

      newParticles.push({
        id: i,
        style: {
          position: 'absolute',
          left: config.anim === 'seasonFly' ? undefined : `${left}%`,
          top: config.anim === 'seasonFly' ? `${top}%` : undefined,
          width: `${size}rem`,
          height: `${size}rem`,
          opacity: targetOpacity,
          animation: `${config.anim} ${animDuration}s linear ${delay}s infinite`,
          backgroundImage: imageUrl,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          pointerEvents: 'none',
          ...config.style
        } as React.CSSProperties
      });
    }
    setParticles(newParticles);
  }, [config]);

  useEffect(() => {
    generateParticles();
  }, [generateParticles]);

  if (!config || particles.length === 0) return null;

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0, // MUST BE BEHIND EVERYTHING
      }}>
        {particles.map((p) => (
          <div key={p.id} style={p.style} />
        ))}
      </div>
    </>
  );
}
