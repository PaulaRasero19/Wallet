import { StyleSheet, View } from "react-native";
import { colors } from "../theme";
import { Dot } from "./Dot";

export function PageIndicator({ total, active, light = false }: { total: number; active: number; light?: boolean }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <Dot key={index} color={index === active ? (light ? "white" : "black") : colors.grayLight} size={index === active ? 7 : 6} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  }
});
