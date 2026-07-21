import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme";

type DotChartProps = {
  points?: number[];
  width?: number;
  height?: number;
};

export function DotChart({ points = [], width = 300, height = 110 }: DotChartProps) {
  if (points.length === 0) {
    return <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  const step = points.length > 1 ? width / (points.length - 1) : width;

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {points.map((value, index) => {
        const normalized = (value - min) / range;
        return <Circle key={`${value}-${index}`} cx={index * step} cy={height - normalized * height} r={4.2} fill={colors.white} />;
      })}
    </Svg>
  );
}
