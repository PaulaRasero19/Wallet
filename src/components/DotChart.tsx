import Svg, { Circle } from "react-native-svg";
import { colors } from "../theme";

type DotChartProps = {
  width?: number;
  height?: number;
};

const points = [42, 47, 45, 52, 57, 55, 63, 60, 66, 70, 65, 72, 76, 73, 80, 85, 82, 88, 92, 89, 95];

export function DotChart({ width = 300, height = 110 }: DotChartProps) {
  const step = width / (points.length - 1);

  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {points.map((value, index) => {
        const accent = index === 7 ? colors.orange : index === 13 ? colors.blue : index === 17 ? colors.lime : colors.white;
        return <Circle key={`${value}-${index}`} cx={index * step} cy={height - value} r={4.2} fill={accent} />;
      })}
    </Svg>
  );
}
