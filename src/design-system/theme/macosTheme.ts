import { createLightTheme, createDarkTheme, type BrandVariants } from '@fluentui/react-components';
import { macosColors, macosRadii, macosShadows, macosFonts } from './tokens';

// macOS blue brand ramp for Fluent UI
const macosBrand: BrandVariants = {
  10: '#001B3F',
  20: '#002D6B',
  30: '#003F97',
  40: '#0050BD',
  50: '#0062E3',
  60: '#0071F5',
  70: '#007AFF',  // macOS accent
  80: '#3395FF',
  90: '#66B0FF',
  100: '#99CBFF',
  110: '#B3D9FF',
  120: '#CCE6FF',
  130: '#E0EFFF',
  140: '#EFF6FF',
  150: '#F7FBFF',
  160: '#FFFFFF',
};

const baseLightTheme = createLightTheme(macosBrand);
const baseDarkTheme = createDarkTheme(macosBrand);

export const macosLightTheme = {
  ...baseLightTheme,
  fontFamilyBase: macosFonts.fontFamily,
  fontFamilyMonospace: macosFonts.fontFamilyMono,
  borderRadiusSmall: macosRadii.small,
  borderRadiusMedium: macosRadii.small,
  borderRadiusLarge: macosRadii.medium,
  borderRadiusXLarge: macosRadii.large,
  shadow2: macosShadows.subtle,
  shadow4: macosShadows.hover,
  shadow8: macosShadows.elevated,
  shadow16: macosShadows.elevated,
  shadow28: macosShadows.dialog,
  shadow64: macosShadows.dialog,
  colorNeutralForeground1: macosColors.light.textPrimary,
  colorNeutralForeground2: macosColors.light.textSecondary,
  colorNeutralForeground3: macosColors.light.textTertiary,
  colorNeutralBackground1: macosColors.light.backgroundSolid,
  colorNeutralBackground1Hover: macosColors.light.hoverBackground,
  colorNeutralBackground1Selected: macosColors.light.selectedBackground,
  colorBrandForeground1: macosColors.light.accent,
  colorBrandBackground: macosColors.light.accent,
  colorBrandBackgroundHover: macosColors.light.accentHover,
  colorBrandBackgroundPressed: macosColors.light.accentPressed,
  colorNeutralStroke1: macosColors.light.separator,
};

export const macosDarkTheme = {
  ...baseDarkTheme,
  fontFamilyBase: macosFonts.fontFamily,
  fontFamilyMonospace: macosFonts.fontFamilyMono,
  borderRadiusSmall: macosRadii.small,
  borderRadiusMedium: macosRadii.small,
  borderRadiusLarge: macosRadii.medium,
  borderRadiusXLarge: macosRadii.large,
  shadow2: macosShadows.subtle,
  shadow4: macosShadows.hover,
  shadow8: macosShadows.elevated,
  shadow16: macosShadows.elevated,
  shadow28: macosShadows.dialog,
  shadow64: macosShadows.dialog,
  colorNeutralForeground1: macosColors.dark.textPrimary,
  colorNeutralForeground2: macosColors.dark.textSecondary,
  colorNeutralForeground3: macosColors.dark.textTertiary,
  colorNeutralBackground1: macosColors.dark.backgroundSolid,
  colorNeutralBackground1Hover: macosColors.dark.hoverBackground,
  colorNeutralBackground1Selected: macosColors.dark.selectedBackground,
  colorBrandForeground1: macosColors.dark.accent,
  colorBrandBackground: macosColors.dark.accent,
  colorBrandBackgroundHover: macosColors.dark.accentHover,
  colorBrandBackgroundPressed: macosColors.dark.accentPressed,
  colorNeutralStroke1: macosColors.dark.separator,
};
