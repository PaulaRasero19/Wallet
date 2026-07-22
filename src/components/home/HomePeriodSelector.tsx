import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme";

export const homePeriods = ["1D", "1W", "1M", "3M", "1Y", "All"] as const;
export type HomePeriod = (typeof homePeriods)[number];

export function periodToApi(period: HomePeriod) {
  const map: Record<HomePeriod, string> = {
    "1D": "1d",
    "1W": "1w",
    "1M": "1m",
    "3M": "3m",
    "1Y": "1y",
    All: "all"
  };
  return map[period];
}

export function HomePeriodSelector({ onChange, value }: { onChange: (period: HomePeriod) => void; value: HomePeriod }) {
  return (
    <View style={styles.row}>
      {homePeriods.map((period) => {
        const active = value === period;
        return (
          <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} key={period} onPress={() => onChange(period)} style={[styles.item, active && styles.active]}>
            <Text style={[styles.text, active && styles.activeText]}>{period}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  active: {
    backgroundColor: "rgba(20,20,20,0.84)"
  },
  activeText: {
    color: colors.white
  },
  item: {
    alignItems: "center",
    borderRadius: 18,
    height: 30,
    justifyContent: "center",
    minWidth: 48,
    paddingHorizontal: 10
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%"
  },
  text: {
    ...typography.body,
    color: colors.white,
    fontSize: 14,
    lineHeight: 17
  }
});
