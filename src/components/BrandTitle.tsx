/**
 * "Jyotish Lab" header title: the brand name and mark stay identical in every language
 * (always the Latin display font, never translated).
 */
import { View } from "react-native";
import { LogoMark, Text } from "@/components/ui";
import { fontSets, makeStyles } from "@/theme";

export const BRAND_NAME = "Jyotish Lab";

export function BrandTitle() {
  const s = useStyles();
  return (
    <View style={s.row} accessibilityRole="header" accessibilityLabel={BRAND_NAME}>
      <LogoMark size={22} />
      <Text style={s.name} numberOfLines={1}>{BRAND_NAME}</Text>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontFamily: fontSets.latin.display, fontSize: 17, lineHeight: 26, color: t.colors.ink, letterSpacing: -0.2 },
}));
