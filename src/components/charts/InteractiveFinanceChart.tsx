import { useMemo, useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, Vibration, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";
import { colors, typography } from "../../theme";
import { Currency, DailyHistoryPoint } from "../../types/finflow";
import { formatMoney } from "../../utils/money";
import { HomePeriod, HomePeriodSelector } from "../home/HomePeriodSelector";

export type ChartMetric = "balance" | "expenses" | "income";

const metricLabels: Record<ChartMetric, string> = {
  balance: "Saldo",
  expenses: "Gastos",
  income: "Ingresos"
};

type Point = {
  date: string;
  expenses: number;
  income: number;
  raw: number;
  x: number;
  y: number;
};

function metricValue(point: DailyHistoryPoint, metric: ChartMetric) {
  if (metric === "balance") return Number(point.closingBalance || 0);
  if (metric === "expenses") return Number(point.expenses || 0);
  return Number(point.income || 0);
}

function compactPoints(history: DailyHistoryPoint[], metric: ChartMetric, max = 34) {
  if (history.length <= max) return history;
  const chunkSize = Math.ceil(history.length / max);
  const points: DailyHistoryPoint[] = [];
  for (let index = 0; index < history.length; index += chunkSize) {
    const chunk = history.slice(index, index + chunkSize);
    const last = chunk[chunk.length - 1];
    points.push({
      date: last.date,
      closingBalance: metric === "balance" ? last.closingBalance : chunk.reduce((sum, item) => sum + item.closingBalance, 0) / chunk.length,
      expenses: chunk.reduce((sum, item) => sum + item.expenses, 0),
      income: chunk.reduce((sum, item) => sum + item.income, 0)
    });
  }
  return points;
}

function makePath(points: Point[]) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-UY", { day: "2-digit", month: "short" });
}

export function InteractiveFinanceChart({
  currency,
  history,
  metric,
  onMetricChange,
  onPeriodChange,
  period
}: {
  currency: Currency;
  history: DailyHistoryPoint[];
  metric: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
  onPeriodChange: (period: HomePeriod) => void;
  period: HomePeriod;
}) {
  const width = 330;
  const height = 180;
  const horizontalPadding = 28;
  const verticalPadding = 24;
  const lastSelection = useRef(-1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const points = useMemo(() => {
    const source = compactPoints(history, metric);
    const values = source.map((point) => metricValue(point, metric));
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = max - min || 1;
    const availableWidth = width - horizontalPadding * 2;
    const availableHeight = height - verticalPadding * 2;

    return source.map((item, index) => ({
      date: item.date,
      expenses: item.expenses,
      income: item.income,
      raw: metricValue(item, metric),
      x: horizontalPadding + (availableWidth * index) / Math.max(1, source.length - 1),
      y: verticalPadding + availableHeight - ((metricValue(item, metric) - min) / range) * availableHeight
    }));
  }, [history, metric]);

  const values = points.map((point) => point.raw);
  const min = values.length ? Math.min(...values, 0) : 0;
  const max = values.length ? Math.max(...values, 0) : 0;
  const selected = selectedIndex === null ? null : points[selectedIndex];
  const path = makePath(points);

  function selectByX(x: number) {
    if (!points.length) return;
    const nearest = points.reduce((winner, point, index) => {
      const distance = Math.abs(point.x - x);
      return distance < winner.distance ? { distance, index } : winner;
    }, { distance: Number.POSITIVE_INFINITY, index: 0 });
    setSelectedIndex(nearest.index);
    if (lastSelection.current !== nearest.index) {
      lastSelection.current = nearest.index;
      Vibration.vibrate(4);
    }
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => selectByX(event.nativeEvent.locationX),
        onPanResponderMove: (event) => selectByX(event.nativeEvent.locationX),
        onPanResponderRelease: () => undefined,
        onStartShouldSetPanResponder: () => true
      }),
    [points]
  );

  if (!history.length || points.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Sin curva todavía</Text>
        <Text style={styles.emptyText}>Registrá movimientos reales para ver saldo, ingresos y gastos por período.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.title}>{metricLabels[metric]}</Text>
          <Text style={styles.period}>{period} · {formatMoney(min, currency, false)} min · {formatMoney(max, currency, false)} max</Text>
        </View>
        <View style={styles.metricSwitch}>
          {(Object.keys(metricLabels) as ChartMetric[]).map((item) => (
            <Pressable accessibilityRole="button" accessibilityState={{ selected: metric === item }} key={item} onPress={() => onMetricChange(item)} style={[styles.metricButton, metric === item && styles.metricButtonActive]}>
              <Text style={[styles.metricButtonText, metric === item && styles.metricButtonTextActive]}>{metricLabels[item]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View {...panResponder.panHandlers} style={styles.chartBox}>
        <Svg height={height} width="100%" viewBox={`0 0 ${width} ${height}`}>
          <Line x1={horizontalPadding} x2={width - horizontalPadding} y1={height - verticalPadding} y2={height - verticalPadding} stroke="rgba(255,255,255,0.32)" strokeWidth={1} />
          <Line x1={horizontalPadding} x2={width - horizontalPadding} y1={verticalPadding} y2={verticalPadding} stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
          <SvgText fill="rgba(255,255,255,0.74)" fontSize="9" x={horizontalPadding} y={verticalPadding - 7}>
            {formatMoney(max, currency, false)}
          </SvgText>
          <SvgText fill="rgba(255,255,255,0.74)" fontSize="9" x={horizontalPadding} y={height - 7}>
            {formatMoney(min, currency, false)}
          </SvgText>
          <Path d={path} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
          {points.map((point, index) => (
            <Circle
              cx={point.x}
              cy={point.y}
              fill={selectedIndex === index ? colors.orange : "rgba(255,255,255,0.92)"}
              key={`${point.date}-${index}`}
              opacity={selectedIndex === null || selectedIndex === index ? 1 : 0.36}
              r={selectedIndex === index ? 5.2 : 2.5}
            />
          ))}
          {selected ? (
            <>
              <Line x1={selected.x} x2={selected.x} y1={verticalPadding} y2={height - verticalPadding} stroke="rgba(255,255,255,0.42)" strokeDasharray="4 5" strokeWidth={1} />
              <Circle cx={selected.x} cy={selected.y} fill={colors.orange} r={6} />
            </>
          ) : null}
        </Svg>
        {selected ? (
          <View pointerEvents="none" style={[styles.tooltip, { left: Math.min(Math.max(selected.x - 58, 10), width - 126), top: Math.max(4, selected.y - 74) }]}>
            <Text style={styles.tooltipDate}>{formatDate(selected.date)}</Text>
            <Text style={styles.tooltipValue}>{formatMoney(selected.raw, currency, false)}</Text>
            <Text style={styles.tooltipMeta}>Ing. {formatMoney(selected.income, currency, false)} · Gas. {formatMoney(selected.expenses, currency, false)}</Text>
          </View>
        ) : null}
      </View>

      <HomePeriodSelector onChange={onPeriodChange} value={period} />
    </View>
  );
}

const styles = StyleSheet.create({
  chartBox: {
    height: 180,
    marginTop: 8,
    position: "relative",
    width: "100%"
  },
  container: {
    gap: 4,
    width: "100%"
  },
  empty: {
    alignItems: "center",
    height: 210,
    justifyContent: "center",
    paddingHorizontal: 24
  },
  emptyText: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: 6,
    textAlign: "center"
  },
  emptyTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  metricButton: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  metricButtonActive: {
    backgroundColor: "rgba(255,255,255,0.92)"
  },
  metricButtonText: {
    ...typography.label,
    color: "rgba(255,255,255,0.74)",
    fontSize: 10,
    lineHeight: 12
  },
  metricButtonTextActive: {
    color: colors.black
  },
  metricSwitch: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.22)",
    borderRadius: 14,
    flexDirection: "row",
    padding: 3
  },
  period: {
    ...typography.label,
    color: colors.transparentWhite
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  tooltip: {
    backgroundColor: "rgba(18,18,18,0.9)",
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 116,
    padding: 8,
    position: "absolute"
  },
  tooltipDate: {
    ...typography.label,
    color: colors.transparentWhite,
    fontSize: 10,
    lineHeight: 12
  },
  tooltipMeta: {
    ...typography.label,
    color: colors.transparentWhite,
    fontSize: 9,
    lineHeight: 11,
    marginTop: 2
  },
  tooltipValue: {
    ...typography.body,
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
    marginTop: 2
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
