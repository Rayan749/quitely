// macOS-inspired design tokens

export const macosColors = {
  light: {
    background: 'rgba(255, 255, 255, 0.8)',
    backgroundSolid: '#FFFFFF',
    sidebarBackground: 'rgba(246, 246, 246, 0.7)',
    sidebarBackgroundSolid: '#F6F6F6',
    accent: '#007AFF',
    accentHover: '#0066D6',
    accentPressed: '#004EA2',
    textPrimary: '#1D1D1F',
    textSecondary: '#86868B',
    textTertiary: '#AEAEB2',
    separator: 'rgba(0, 0, 0, 0.1)',
    surfaceOverlay: 'rgba(255, 255, 255, 0.3)',
    hoverBackground: 'rgba(0, 0, 0, 0.04)',
    selectedBackground: 'rgba(0, 122, 255, 0.12)',
  },
  dark: {
    background: 'rgba(30, 30, 30, 0.85)',
    backgroundSolid: '#1E1E1E',
    sidebarBackground: 'rgba(40, 40, 40, 0.7)',
    sidebarBackgroundSolid: '#282828',
    accent: '#0A84FF',
    accentHover: '#409CFF',
    accentPressed: '#0071E3',
    textPrimary: '#F5F5F7',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    separator: 'rgba(255, 255, 255, 0.1)',
    surfaceOverlay: 'rgba(255, 255, 255, 0.08)',
    hoverBackground: 'rgba(255, 255, 255, 0.06)',
    selectedBackground: 'rgba(10, 132, 255, 0.2)',
  },
} as const;

export const macosRadii = {
  small: '6px',    // buttons, inputs
  medium: '10px',  // cards, panels
  large: '12px',   // dialogs
} as const;

export const macosShadows = {
  subtle: '0 1px 3px rgba(0, 0, 0, 0.06)',
  hover: '0 2px 8px rgba(0, 0, 0, 0.08)',
  elevated: '0 8px 24px rgba(0, 0, 0, 0.12)',
  dialog: '0 20px 60px rgba(0, 0, 0, 0.15)',
} as const;

export const macosFonts = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', 'Segoe UI', sans-serif",
  fontFamilyMono: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
  baseFontSize: '13px',
} as const;

export const macosGlass = {
  background: 'rgba(255, 255, 255, 0.7)',
  backgroundDark: 'rgba(40, 40, 40, 0.65)',
  backdropFilter: 'saturate(180%) blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  borderDark: '1px solid rgba(255, 255, 255, 0.08)',
} as const;
