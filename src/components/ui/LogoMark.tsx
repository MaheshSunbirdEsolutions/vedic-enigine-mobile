/** The app mark (kundli frame with the sun), drawn with SVG so it scales cleanly and never clips. */
import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from "react-native-svg";
import { useTheme } from "@/theme";

export function LogoMark({ size = 40, color, sun, ring }: { size?: number; color?: string; sun?: string; ring?: string }) {
  const t = useTheme();
  const c = color ?? t.colors.accent;
  return (
    <Svg width={size} height={size} viewBox="200 200 600 600" accessibilityRole="image">
      <Defs>
        <ClipPath id="lm-frame"><Rect x={220} y={220} width={560} height={560} rx={70} /></ClipPath>
      </Defs>
      <G clipPath="url(#lm-frame)" opacity={0.9}>
        <Path d="M220 220 L780 780 M780 220 L220 780" stroke={c} strokeWidth={22} strokeLinecap="round" />
        <Path d="M500 220 L780 500 L500 780 L220 500 Z" fill="none" stroke={c} strokeWidth={22} strokeLinejoin="round" />
      </G>
      <Rect x={220} y={220} width={560} height={560} rx={70} fill="none" stroke={c} strokeWidth={46} />
      <Circle cx={500} cy={500} r={104} fill={ring ?? t.colors.bg} />
      <Circle cx={500} cy={500} r={62} fill={sun ?? (t.dark ? "#f0bf5a" : "#e39a2f")} />
    </Svg>
  );
}
