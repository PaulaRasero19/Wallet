import { StyleSheet, Text, View } from "react-native";
import { typography } from "../../theme";
import { resolveMerchantLogo } from "../../utils/merchantLogoResolver";

export function MerchantLogo({
  category,
  merchant,
  size = 46,
  title
}: {
  category?: string | null;
  merchant?: string | null;
  size?: number;
  title?: string | null;
}) {
  const logo = resolveMerchantLogo({ category, merchant, title });
  const radius = size / 2;

  return (
    <View
      accessibilityLabel={logo.label}
      accessibilityRole="image"
      style={[
        styles.wrap,
        {
          backgroundColor: logo.backgroundColor,
          borderRadius: radius,
          height: size,
          width: size
        }
      ]}
    >
      <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.initials, { color: logo.foregroundColor, fontSize: logo.initials.length > 2 ? size * 0.22 : size * 0.3 }]}>
        {logo.initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  initials: {
    ...typography.label,
    fontWeight: "900",
    lineHeight: 16,
    textAlign: "center"
  },
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  }
});
