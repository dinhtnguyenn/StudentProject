export type SeasonId = 'TET' | 'HUNG_KING' | 'CULTURE' | 'TEACHER' | 'MID_AUTUMN' | 'HALLOWEEN' | 'XMAS' | 'NONE';

export interface SeasonalThemeConfig {
  id: SeasonId;
  name: string;
  palette: {
    primary: string;
    secondary: string;
    goldenTicket: string;
    modeOverride?: 'light' | 'dark';
  };
}

export const SEASONAL_THEMES: Record<SeasonId, SeasonalThemeConfig> = {
  TET: { id: 'TET', name: 'Tết Nguyên Đán', palette: { primary: '#DC2626', secondary: '#FCA5A5', goldenTicket: '#FBBF24' } },
  HUNG_KING: { id: 'HUNG_KING', name: 'Giỗ Tổ Hùng Vương', palette: { primary: '#991B1B', secondary: '#FCA5A5', goldenTicket: '#FBBF24' } },
  CULTURE: { id: 'CULTURE', name: 'Ngày Văn hóa Việt Nam', palette: { primary: '#D946EF', secondary: '#F472B6', goldenTicket: '#84CC16' } },
  TEACHER: { id: 'TEACHER', name: 'Ngày Nhà giáo VN', palette: { primary: '#1E3A8A', secondary: '#60A5FA', goldenTicket: '#FCD34D' } },
  MID_AUTUMN: { id: 'MID_AUTUMN', name: 'Tết Trung Thu', palette: { primary: '#3B82F6', secondary: '#93C5FD', goldenTicket: '#F59E0B', modeOverride: 'dark' } },
  HALLOWEEN: { id: 'HALLOWEEN', name: 'Halloween', palette: { primary: '#111827', secondary: '#6B7280', goldenTicket: '#F97316' } },
  XMAS: { id: 'XMAS', name: 'Lễ Giáng Sinh', palette: { primary: '#2563EB', secondary: '#60A5FA', goldenTicket: '#E11D48' } },
  NONE: { id: 'NONE', name: 'Mặc định', palette: { primary: '#2563EB', secondary: '#60A5FA', goldenTicket: '#F59E0B' } }
};

// Hardcoded approximate Gregorian dates for Vietnamese Lunar Holidays (2024-2030)
// Format: MM-DD
const LUNAR_MAP = {
  2024: { TET: '02-10', HUNG_KING: '04-18', MID_AUTUMN: '09-17' },
  2025: { TET: '01-29', HUNG_KING: '04-07', MID_AUTUMN: '10-06' },
  2026: { TET: '02-17', HUNG_KING: '04-26', MID_AUTUMN: '09-25' },
  2027: { TET: '02-06', HUNG_KING: '04-16', MID_AUTUMN: '09-15' },
  2028: { TET: '01-26', HUNG_KING: '04-04', MID_AUTUMN: '10-03' },
  2029: { TET: '02-13', HUNG_KING: '04-23', MID_AUTUMN: '09-22' },
  2030: { TET: '02-02', HUNG_KING: '04-12', MID_AUTUMN: '09-12' },
};

function parseMMDD(dateString: string, year: number): Date {
  const [mm, dd] = dateString.split('-').map(Number);
  return new Date(year, mm - 1, dd);
}

function isWithinRange(target: Date, base: Date, daysBefore: number, daysAfter: number): boolean {
  const diffTime = target.getTime() - base.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= -daysBefore && diffDays <= daysAfter;
}

export function getCurrentSeason(): SeasonalThemeConfig {
  // Allow developer override via URL e.g. ?season=XMAS
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const override = params.get('season') as SeasonId;
  if (override && SEASONAL_THEMES[override]) {
    return SEASONAL_THEMES[override];
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const mmdd = `${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

  // 1. Fixed Gregorian Dates
  if (mmdd === '04-18' || mmdd === '04-19' || mmdd === '04-20') return SEASONAL_THEMES.CULTURE;
  if (month === 11 && date >= 18 && date <= 21) return SEASONAL_THEMES.TEACHER;
  if (month === 10 && date >= 28) return SEASONAL_THEMES.HALLOWEEN;
  if (month === 11 && date <= 2) return SEASONAL_THEMES.HALLOWEEN;
  if (month === 12 && date >= 10 && date <= 30) return SEASONAL_THEMES.XMAS;

  // 2. Dynamic Lunar Dates
  const lunarMap = LUNAR_MAP[year as keyof typeof LUNAR_MAP];
  if (lunarMap) {
    const tetDate = parseMMDD(lunarMap.TET, year);
    if (isWithinRange(now, tetDate, 7, 7)) return SEASONAL_THEMES.TET; // 7 days before and after

    const hungKingDate = parseMMDD(lunarMap.HUNG_KING, year);
    if (isWithinRange(now, hungKingDate, 2, 2)) return SEASONAL_THEMES.HUNG_KING;

    const midAutumnDate = parseMMDD(lunarMap.MID_AUTUMN, year);
    if (isWithinRange(now, midAutumnDate, 3, 3)) return SEASONAL_THEMES.MID_AUTUMN;
  }

  return SEASONAL_THEMES.NONE;
}
