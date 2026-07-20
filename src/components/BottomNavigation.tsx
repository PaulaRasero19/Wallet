import { Pressable, StyleSheet, View } from "react-native";
import { ArrowLeftRight, CalendarDays, Home, Plus, UserRound } from "lucide-react-native";
import { colors } from "../theme";
import { DotGrid } from "./DotGrid";

const iconMap = {
  overview: Home,
  transactions: ArrowLeftRight,
  add: Plus,
  planner: CalendarDays,
  profile: UserRound
};

export function BottomNavigation({ state, navigation }: any) {
  return (
    <View style={styles.wrap}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const Icon = iconMap[route.name as keyof typeof iconMap] || Home;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={[styles.item, focused && styles.activeItem]}
          >
            {focused ? <DotGrid columns={2} dotSize={5} gap={4} matrix={["black", "black", "black", "orange"]} /> : <Icon color={colors.grayMedium} size={19} strokeWidth={1.8} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderColor: colors.grayLight,
    borderRadius: 30,
    borderWidth: 1,
    bottom: 18,
    flexDirection: "row",
    height: 60,
    justifyContent: "space-between",
    paddingHorizontal: 9,
    position: "absolute",
    width: "82%"
  },
  item: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  activeItem: {
    backgroundColor: colors.background
  }
});
