import Svg, { Circle } from "react-native-svg";
import { Budget } from "../types/finflow";
import { colors } from "../theme";

type BudgetDotRingProps = {
  budgets: Budget[];
  size?: number;
};

export function BudgetDotRing({ budgets, size = 214 }: BudgetDotRingProps) {
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const dots = 40;
  const radius = size / 2 - 14;
  let cursor = 0;
  const segments = budgets.map((budget) => {
    const count = Math.max(1, Math.round((budget.spent / Math.max(totalSpent, 1)) * dots));
    const segment = { ...budget, start: cursor, end: cursor + count };
    cursor += count;
    return segment;
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: dots }).map((_, index) => {
        const angle = -90 + (index / dots) * 360;
        const rad = (angle * Math.PI) / 180;
        const segment = segments.find((entry) => index >= entry.start && index < entry.end);
        const fill = segment ? colors[segment.accent] : colors.grayLight;
        return (
          <Circle
            key={index}
            cx={size / 2 + radius * Math.cos(rad)}
            cy={size / 2 + radius * Math.sin(rad)}
            fill={fill}
            r={5.8}
          />
        );
      })}
    </Svg>
  );
}
