export const colors = {
  background: "#F7F4EF",
  surface: "#FFFFFF",
  appGray: "#55554F",
  appGrayDark: "#3F403B",
  appGraySoft: "rgba(255,255,255,0.1)",
  appGrayBorder: "rgba(255,255,255,0.16)",
  black: "#0A0A0A",
  darkSurface: "#151515",
  grayDark: "#333333",
  grayMedium: "#8F8B84",
  grayLight: "#DED9D1",
  orange: "#FF4F18",
  blue: "#164CFF",
  lime: "#B8DC36",
  lavender: "#A99BEF",
  negative: "#913430",
  positive: "#649B3E",
  cream: "#F7F4EF",
  white: "#FFFFFF",
  transparentWhite: "rgba(255,255,255,0.72)",
  transparentBlack: "rgba(10,10,10,0.08)"
} as const;

export type AccentColor = "orange" | "blue" | "lime" | "lavender" | "black" | "grayLight";
