import Svg, { Line } from "react-native-svg";
import { colors } from "../../theme";

export function FlowMark({ accent = true, color = colors.white, size = 72 }: { accent?: boolean; color?: string; size?: number }) {
  return (
    <Svg accessibilityLabel="Símbolo de FinFlow" height={size} viewBox="0 0 100 100" width={size}>
      <Line x1="13" x2="36" y1="75" y2="52" stroke={color} strokeLinecap="round" strokeWidth="12" />
      <Line x1="38" x2="66" y1="70" y2="42" stroke={color} strokeLinecap="round" strokeWidth="12" />
      <Line x1="65" x2="94" y1="62" y2="33" stroke={accent ? colors.brandOrange : color} strokeLinecap="round" strokeWidth="12" />
    </Svg>
  );
}
