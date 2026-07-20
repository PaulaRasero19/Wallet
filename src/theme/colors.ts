export const colors = {
  background: "#F7F4EF",
  surface: "#FFFFFF",
  black: "#0A0A0A",
  darkSurface: "#151515",
  grayDark: "#333333",
  grayMedium: "#8F8B84",
  grayLight: "#DED9D1",
  orange: "#FF4F18",
  blue: "#164CFF",
  lime: "#B8DC36",
  lavender: "#A99BEF",
  cream: "#F7F4EF",
  white: "#FFFFFF",
  transparentWhite: "rgba(255,255,255,0.72)",
  transparentBlack: "rgba(10,10,10,0.08)"
} as const;

export type AccentColor = "orange" | "blue" | "lime" | "lavender" | "black" | "grayLight";
