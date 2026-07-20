import { ViewStyle } from "react-native";
import { DotGrid } from "./DotGrid";

export function DotLogo({ light = false, style }: { light?: boolean; style?: ViewStyle }) {
  const base = light ? "white" : "black";
  return (
    <DotGrid
      columns={3}
      dotSize={12}
      gap={8}
      matrix={[base, base, base, base, base, base, base, base, "orange"]}
      animated
    />
  );
}
