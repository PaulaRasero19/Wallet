import { useMemo } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, typography } from "../../theme";
import { Currency, DailyHistoryPoint } from "../../types/finflow";
import { HomePeriod } from "./PeriodSelector";

type ChartPoint = {
  date: string;
  expenses: number;
  income: number;
  raw: number;
  x: number;
  y: number;
};

function sampleHistory(history: DailyHistoryPoint[], period: HomePeriod) {
  if (history.length <= 1) {
    const point = history[0] || { closingBalance: 0, date: new Date().toISOString().slice(0, 10), expenses: 0, income: 0 };
    return [point, point];
  }

  const maxPoints = period === "1D" ? 8 : period === "1W" ? 7 : period === "1M" ? 16 : period === "3M" ? 13 : 12;
  if (history.length <= maxPoints) return history;

  const chunkSize = Math.ceil(history.length / maxPoints);
  const sampled: DailyHistoryPoint[] = [];
  for (let index = 0; index < history.length; index += chunkSize) {
    const chunk = history.slice(index, index + chunkSize);
    const last = chunk[chunk.length - 1];
    sampled.push({
      date: last.date,
      closingBalance: last.closingBalance,
      expenses: chunk.reduce((sum, item) => sum + item.expenses, 0),
      income: chunk.reduce((sum, item) => sum + item.income, 0)
    });
  }
  return sampled;
}

function makePath(points: ChartPoint[]) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `${path} L ${point.x} ${point.y}`;
  }, "");
}

export function HomeBalanceChart({ currency, history, period }: { currency: Currency; history: DailyHistoryPoint[]; period: HomePeriod }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(360, Math.max(330, width - 64));
  const chartHeight = 96;

  const points = useMemo(() => {
    const source = sampleHistory(history, period);
    const rawValues = source.map((point) => Number(point.closingBalance || 0));
    const left = 24;
    const right = chartWidth - 46;
    const top = 10;
    const bottom = chartHeight - 14;
    const minValue = Math.min(...rawValues);
    const maxValue = Math.max(...rawValues);
    const range = maxValue - minValue;

    return source.map((item, index) => ({
      date: item.date,
      expenses: item.expenses,
      income: item.income,
      raw: rawValues[index],
      x: left + ((right - left) * index) / Math.max(1, source.length - 1),
      y: range === 0 ? (top + bottom) / 2 : bottom - ((rawValues[index] - minValue) / range) * (bottom - top)
    }));
  }, [chartWidth, history, period]);

  const path = makePath(points);

  if (!history.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Registrá movimientos para ver la evolución.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: chartWidth }]}>
      <Svg height={chartHeight} width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Path d={path} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} />
        {points.map((point, index) => (
          <Circle cx={point.x} cy={point.y} fill="#FFFFFF" key={`${point.date}-${index}-dot`} r={index === points.length - 1 ? 6.8 : 5} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: "center",
    height: 96,
    justifyContent: "center",
    paddingHorizontal: 38
  },
  emptyText: {
    ...typography.label,
    color: colors.transparentWhite,
    textAlign: "center"
  },
  wrap: {
    alignSelf: "center",
    height: 96,
    marginTop: 24,
    position: "relative"
  }
});
