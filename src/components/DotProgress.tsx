import { StyleSheet, View } from "react-native";
import { AccentColor, colors } from "../theme";
import { Dot } from "./Dot";

type DotProgressProps = {
  progress: number;
  total?: number;
  color?: AccentColor;
  size?: number;
};

export function DotProgress({ progress, total = 10, color = "black", size = 9 }: DotProgressProps) {
  const filled = Math.round((Math.max(0, Math.min(progress, 100)) / 100) * total);

  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <Dot key={index} color={index < filled ? color : colors.grayLight} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 5
  }
});
