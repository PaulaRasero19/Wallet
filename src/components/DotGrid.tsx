import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { AccentColor, colors } from "../theme";
import { Dot } from "./Dot";

type DotGridProps = {
  matrix?: Array<AccentColor | keyof typeof colors | "empty">;
  columns?: number;
  dotSize?: number;
  gap?: number;
  animated?: boolean;
};

const defaultMatrix: Array<AccentColor> = [
  "black",
  "black",
  "black",
  "black",
  "black",
  "black",
  "black",
  "black",
  "orange"
];

export function DotGrid({ matrix = defaultMatrix, columns = 3, dotSize = 10, gap = 7, animated = false }: DotGridProps) {
  return (
    <View style={[styles.grid, { width: columns * dotSize + (columns - 1) * gap, gap }]}>
      {matrix.map((color, index) => {
        const item = color === "empty" ? (
          <View key={index} style={{ width: dotSize, height: dotSize }} />
        ) : (
          <Dot key={index} color={color} size={dotSize} />
        );

        if (!animated) return item;

        return (
          <Animated.View key={index} entering={ZoomIn.delay(index * 90).duration(320)}>
            {item}
          </Animated.View>
        );
      })}
    </View>
  );
}

export function DotComposition({ variant }: { variant: 1 | 2 | 3 }) {
  const palette: Array<AccentColor | keyof typeof colors | "empty"> =
    variant === 1
      ? ["empty", "grayLight", "empty", "grayLight", "orange", "grayLight", "grayLight", "black", "grayLight", "blue", "empty", "black", "empty", "black", "empty", "grayLight", "grayLight", "empty", "empty", "grayLight", "empty"]
      : variant === 2
        ? ["grayLight", "empty", "black", "empty", "grayLight", "grayLight", "blue", "grayLight", "empty", "grayLight", "black", "grayLight", "lime", "empty", "lavender", "empty", "grayLight", "empty", "black", "grayLight", "empty"]
        : ["empty", "grayLight", "empty", "blue", "empty", "grayLight", "empty", "orange", "black", "lime", "empty", "grayLight", "empty", "lavender", "empty", "grayLight"];

  return (
    <View style={styles.composition}>
      <DotGrid matrix={palette} columns={variant === 3 ? 4 : 5} dotSize={variant === 3 ? 14 : 16} gap={15} animated />
      {variant === 3 ? (
        <>
          <View style={[styles.orbit, styles.orbitOne]} />
          <View style={[styles.orbit, styles.orbitTwo]} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  composition: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 240,
    position: "relative"
  },
  orbit: {
    borderColor: colors.grayLight,
    borderRadius: 999,
    borderWidth: 1,
    position: "absolute"
  },
  orbitOne: {
    height: 160,
    width: 160
  },
  orbitTwo: {
    height: 98,
    width: 98
  }
});
