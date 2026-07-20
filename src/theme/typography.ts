import { TextStyle } from "react-native";
import { colors } from "./colors";

const fontFamily = "System";

export const typography = {
  display: {
    color: colors.black,
    fontFamily,
    fontSize: 34,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 38
  } satisfies TextStyle,
  title: {
    color: colors.black,
    fontFamily,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 27
  } satisfies TextStyle,
  value: {
    color: colors.black,
    fontFamily,
    fontSize: 34,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 39
  } satisfies TextStyle,
  body: {
    color: colors.grayDark,
    fontFamily,
    fontSize: 15,
    fontWeight: "400",
    letterSpacing: 0,
    lineHeight: 22
  } satisfies TextStyle,
  label: {
    color: colors.grayMedium,
    fontFamily,
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0,
    lineHeight: 16
  } satisfies TextStyle,
  button: {
    color: colors.white,
    fontFamily,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0,
    lineHeight: 18
  } satisfies TextStyle
} as const;
