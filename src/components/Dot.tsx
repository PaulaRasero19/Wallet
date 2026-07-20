import { View, ViewStyle } from "react-native";
import { AccentColor, colors } from "../theme";

type DotProps = {
  color?: AccentColor | string;
  size?: number;
  style?: ViewStyle;
};

export function Dot({ color = "black", size = 8, style }: DotProps) {
  const backgroundColor = color in colors ? colors[color as keyof typeof colors] : color;

  return (
    <View
      accessibilityRole="image"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor
        },
        style
      ]}
    />
  );
}
