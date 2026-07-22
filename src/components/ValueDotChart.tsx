import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";
import { DailyHistoryPoint } from "../types/finflow";
import { colors, spacing, typography } from "../theme";
import { formatMoney } from "../utils/money";

type Metric = "balance" | "expenses" | "income";

type Props = {
  title: string;
  period: string;
  points: DailyHistoryPoint[];
  metric?: Metric;
  onMetricChange?: (metric: Metric) => void;
  onPeriodChange?: (period: string) => void;
};

const metrics: { key: Metric; label: string }[] = [
  { key: "balance", label: "Saldo" },
  { key: "expenses", label: "Gastos" },
  { key: "income", label: "Ingresos" }
];

const periods = ["7d", "30d", "3m", "6m"];

function shortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-UY", { day: "2-digit", month: "short" });
}

export function ValueDotChart({ title, period, points, metric = "balance", onMetricChange, onPeriodChange }: Props) {
  const [selected, setSelected] = useState(Math.max(0, points.length - 1));
  const width = 320;
  const height = 116;
  const valueFor = (point: DailyHistoryPoint) => (metric === "balance" ? point.closingBalance : metric === "expenses" ? point.expenses : point.income);
  const values = points.map(valueFor);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const range = Math.max(max - min, 1);

  const chartPoints = useMemo(
    () =>
      points.map((point, index) => {
        const value = valueFor(point);
        const x = points.length > 1 ? (index / (points.length - 1)) * width : width / 2;
        const y = height - ((value - min) / range) * (height - 24) - 12;
        return { ...point, value, x, y };
      }),
    [height, metric, min, points, range]
  );

  const active = chartPoints[Math.min(selected, Math.max(0, chartPoints.length - 1))];
  const polyline = chartPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const firstDate = points[0]?.date ? shortDate(points[0].date) : "";
  const lastDate = points[points.length - 1]?.date ? shortDate(points[points.length - 1].date) : "";

  if (points.length === 0) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.empty}>Sin movimientos reales para graficar.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.period}>{period} · UYU</Text>
        </View>
        <Text style={styles.range}>min {formatMoney(min, "UYU", false)} · max {formatMoney(max, "UYU", false)}</Text>
      </View>

      <View style={styles.switchRow}>
        {metrics.map((item) => (
          <Pressable key={item.key} accessibilityRole="button" onPress={() => onMetricChange?.(item.key)} style={[styles.switch, metric === item.key && styles.switchActive]}>
            <Text style={[styles.switchText, metric === item.key && styles.switchTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={0} x2={width} y1={12} y2={12} stroke={colors.appGrayBorder} strokeWidth={1} />
        <Line x1={0} x2={width} y1={height - 12} y2={height - 12} stroke={colors.appGrayBorder} strokeWidth={1} />
        <Polyline points={polyline} fill="none" stroke={colors.white} strokeWidth={1.8} />
        {chartPoints.map((point, index) => (
          <Circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r={index === selected ? 5.8 : 3.8} fill={index === selected ? colors.orange : colors.white} />
        ))}
      </Svg>

      <View style={styles.touchRow}>
        {chartPoints.map((point, index) => (
          <Pressable key={point.date} accessibilityRole="button" onPress={() => setSelected(index)} style={styles.touchPoint} />
        ))}
      </View>

      <View style={styles.axis}>
        <Text style={styles.axisText}>{firstDate}</Text>
        {active ? (
          <Text style={styles.tooltip}>
            {shortDate(active.date)} · I {formatMoney(active.income, "UYU", false)} · G {formatMoney(active.expenses, "UYU", false)} · S {formatMoney(active.closingBalance, "UYU", false)}
          </Text>
        ) : null}
        <Text style={styles.axisText}>{lastDate}</Text>
      </View>

      <View style={styles.periods}>
        {periods.map((item) => (
          <Pressable key={item} accessibilityRole="button" onPress={() => onPeriodChange?.(item)} style={[styles.periodButton, period === item && styles.periodActive]}>
            <Text style={[styles.periodText, period === item && styles.periodTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm
  },
  head: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  period: {
    ...typography.label
  },
  range: {
    ...typography.label,
    color: colors.transparentWhite,
    flex: 1,
    textAlign: "right"
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite
  },
  switchRow: {
    flexDirection: "row",
    gap: spacing.xs
  },
  switch: {
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  switchActive: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  switchText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "700"
  },
  switchTextActive: {
    color: colors.black
  },
  touchRow: {
    flexDirection: "row",
    height: 16,
    marginTop: -spacing.sm
  },
  touchPoint: {
    flex: 1
  },
  axis: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  axisText: {
    ...typography.label,
    color: colors.transparentWhite
  },
  tooltip: {
    ...typography.label,
    color: colors.white,
    flex: 1,
    textAlign: "center"
  },
  periods: {
    flexDirection: "row",
    gap: spacing.xs
  },
  periodButton: {
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  periodActive: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  periodText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "700"
  },
  periodTextActive: {
    color: colors.black
  }
});
