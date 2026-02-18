/**
 * Caderneta Design System
 * Modern, Minimalist, Juicy
 * Light & Dark themes
 */

export const LightColors = {
  // Brand
  primary: "#E91E63",
  primaryDark: "#AD1457",
  primaryLight: "#F8BBD0",
  primarySoft: "#FCE4EC",

  // Accent
  accent: "#FF6090",
  accentDark: "#C2185B",

  // Semantic
  success: "#00C853",
  successSoft: "#E8F5E9",
  danger: "#FF1744",
  dangerSoft: "#FFEBEE",
  warning: "#FF9100",
  warningSoft: "#FFF3E0",
  info: "#2979FF",
  infoSoft: "#E3F2FD",

  // Neutrals
  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  border: "#F0F0F0",
  borderLight: "#F5F5F5",
  divider: "#EEEEEE",

  // Text
  text: "#1A1A2E",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  textInverse: "#FFFFFF",
  textOnPrimary: "#FFFFFF",

  // Gradients (used as arrays)
  gradientPrimary: ["#E91E63", "#AD1457"] as const,
  gradientPrimaryLight: ["#F06292", "#E91E63"] as const,
  gradientWarm: ["#FF6090", "#E91E63"] as const,
  gradientDark: ["#880E4F", "#AD1457"] as const,
};

export const DarkColors: ThemeColors = {
  // Brand
  primary: "#F06292",
  primaryDark: "#E91E63",
  primaryLight: "#F8BBD0",
  primarySoft: "rgba(240,98,146,0.15)",

  // Accent
  accent: "#FF6090",
  accentDark: "#C2185B",

  // Semantic
  success: "#69F0AE",
  successSoft: "rgba(105,240,174,0.12)",
  danger: "#FF5252",
  dangerSoft: "rgba(255,82,82,0.12)",
  warning: "#FFD740",
  warningSoft: "rgba(255,215,64,0.12)",
  info: "#448AFF",
  infoSoft: "rgba(68,138,255,0.12)",

  // Neutrals
  background: "#121212",
  surface: "#1E1E1E",
  surfaceElevated: "#2C2C2C",
  border: "#333333",
  borderLight: "#2A2A2A",
  divider: "#333333",

  // Text
  text: "#F5F5F5",
  textSecondary: "#B0BEC5",
  textTertiary: "#78909C",
  textInverse: "#FFFFFF",
  textOnPrimary: "#FFFFFF",

  // Gradients
  gradientPrimary: ["#E91E63", "#880E4F"] as const,
  gradientPrimaryLight: ["#F06292", "#E91E63"] as const,
  gradientWarm: ["#FF6090", "#E91E63"] as const,
  gradientDark: ["#880E4F", "#AD1457"] as const,
};

export type ThemeColors = typeof LightColors;

/** @deprecated Use useThemeColors() hook instead for dark mode support */
export const Colors = LightColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  heavy: "800" as const,
};

export const Shadows = {
  sm: {
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  button: {
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  fab: {
    shadowColor: "#E91E63",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
};
