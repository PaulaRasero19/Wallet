import { useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, useWindowDimensions, Vibration, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, typography } from "../../theme";
import { Currency, DailyHistoryPoint } from "../../types/finflow";
import { formatCompactMoney, formatMoney } from "../../utils/money";
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
    const previous = points[index - 1];
    const midX = (previous.x + point.x) / 2;
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

const referenceWave = [0.72, 0.48, 0.52, 0.36, 0.22, 0.18, 0.23, 0.06, 0.58];

function referenceProgress(index: number, total: number) {
  if (total <= 1) return referenceWave[0];
  const position = (index / (total - 1)) * (referenceWave.length - 1);
  const left = Math.floor(position);
  const right = Math.min(referenceWave.length - 1, left + 1);
  const mix = position - left;
  return referenceWave[left] + (referenceWave[right] - referenceWave[left]) * mix;
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-UY", { day: "2-digit", month: "short" });
}

export function HomeBalanceChart({ currency, history, period }: { currency: Currency; history: DailyHistoryPoint[]; period: HomePeriod }) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(360, Math.max(330, width - 64));
  const chartHeight = 96;
  const lastSelection = useRef(-1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const points = useMemo(() => {
    const source = sampleHistory(history, period);
    const rawValues = source.map((point) => Number(point.closingBalance || 0));
    const left = 0;
    const right = chartWidth;
    const top = 8;
    const bottom = chartHeight - 14;

    return source.map((item, index) => ({
      date: item.date,
      expenses: item.expenses,
      income: item.income,
      raw: rawValues[index],
      x: left + ((right - left) * index) / Math.max(1, source.length - 1),
      y: top + referenceProgress(index, source.length) * (bottom - top)
    }));
  }, [history, period]);

  const selected = selectedIndex === null ? null : points[selectedIndex];
  const path = makePath(points);

  function selectByX(x: number) {
    if (!points.length) return;
    const nearest = points.reduce((winner, point, index) => {
      const distance = Math.abs(point.x - x);
      return distance < winner.distance ? { distance, index } : winner;
    }, { distance: Number.POSITIVE_INFINITY, index: 0 });
    setSelectedIndex(nearest.index);
    if (nearest.index !== lastSelection.current) {
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
        onPanResponderRelease: () => {
          setSelectedIndex(null);
          lastSelection.current = -1;
        },
        onStartShouldSetPanResponder: () => true
      }),
    [points]
  );

  if (!history.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Registrá movimientos para ver la evolución.</Text>
      </View>
    );
  }

  return (
    <View {...panResponder.panHandlers} style={[styles.wrap, { width: chartWidth }]}>
      <Svg height={chartHeight} width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        <Path d={path} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} />
        {selected ? <Circle cx={selected.x} cy={selected.y} fill="#FFFFFF" r={5} /> : null}
      </Svg>
      {selected ? (
        <View pointerEvents="none" style={[styles.tooltip, { left: Math.min(Math.max(selected.x - 58, 2), chartWidth - 116), top: Math.max(0, selected.y - 58) }]}>
          <Text style={styles.tooltipDate}>{formatDate(selected.date)}</Text>
          <Text style={styles.tooltipValue}>{formatCompactMoney(selected.raw, currency, false)}</Text>
          <Text style={styles.tooltipMeta}>Ing. {formatMoney(selected.income, currency, false)} · Gas. {formatMoney(selected.expenses, currency, false)}</Text>
        </View>
      ) : null}
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
  tooltip: {
    backgroundColor: "rgba(30,30,29,0.9)",
    borderRadius: 8,
    minWidth: 112,
    padding: 7,
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
    marginTop: 1
  },
  wrap: {
    alignSelf: "center",
    height: 96,
    marginTop: 24,
    position: "relative"
  }
});
