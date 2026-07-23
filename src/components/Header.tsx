import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowLeft, Bell, Filter, Search } from "lucide-react-native";
import { router } from "expo-router";
import { colors, spacing, typography } from "../theme";
import { DotLogo } from "./DotLogo";

type HeaderProps = {
  title: string;
  dark?: boolean;
  back?: boolean;
  actions?: Array<"search" | "filter" | "bell" | "logo">;
  right?: ReactNode;
  onBack?: () => void;
};

export function Header({ title, dark = true, back = false, actions = [], right, onBack }: HeaderProps) {
  const tint = dark ? colors.white : colors.black;
  const muted = dark ? colors.transparentWhite : colors.grayMedium;

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {back ? (
          <Pressable accessibilityRole="button" onPress={onBack || (() => router.back())} style={styles.iconButton}>
            <ArrowLeft color={tint} size={20} />
          </Pressable>
        ) : null}
        <Text style={[styles.title, { color: tint }]}>{title}</Text>
      </View>
      <View style={styles.actions}>
        {actions.includes("logo") ? <DotLogo light={dark} /> : null}
        {actions.includes("search") ? <Search color={tint} size={20} /> : null}
        {actions.includes("filter") ? <Filter color={tint} size={20} /> : null}
        {actions.includes("bell") ? <Bell color={muted} size={19} /> : null}
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44
  },
  left: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  title: {
    ...typography.title
  },
  iconButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  }
});
