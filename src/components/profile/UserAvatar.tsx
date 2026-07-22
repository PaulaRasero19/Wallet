import { Image, StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme";

function initialsFrom(name?: string | null) {
  const parts = String(name || "FinFlow")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "FF";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserAvatar({ fullName, size = 48, uri }: { fullName?: string | null; size?: number; uri?: string | null }) {
  const radius = size / 2;

  return (
    <View style={[styles.wrap, { borderRadius: radius, height: size, width: size }]}>
      {uri ? <Image source={{ uri }} style={[styles.image, { borderRadius: radius }]} /> : <Text style={[styles.initials, { fontSize: Math.max(13, size * 0.34) }]}>{initialsFrom(fullName)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    height: "100%",
    width: "100%"
  },
  initials: {
    ...typography.body,
    color: colors.black,
    fontWeight: "800"
  },
  wrap: {
    alignItems: "center",
    backgroundColor: "#F0F0EF",
    justifyContent: "center",
    overflow: "hidden"
  }
});
