import { makeStyles, useTheme } from "@/theme";
import { Icon, type IconName } from "./Icon";
import { PressableScale } from "./PressableScale";

/** Round icon-only button (header actions, delete, clear). Always pass an accessibility label. */
export function IconButton({ icon, onPress, label, tone = "default", size = 40, testID, disabled }: {
  icon: IconName; onPress: () => void; label: string; tone?: "default" | "danger" | "accent"; size?: number; testID?: string; disabled?: boolean;
}) {
  const s = useStyles();
  const t = useTheme();
  const bg = tone === "danger" ? t.colors.badSoft : tone === "accent" ? t.colors.accentSoft : t.colors.fill;
  const fg = tone === "danger" ? t.colors.bad : tone === "accent" ? t.colors.accent : t.colors.ink;
  return (
    <PressableScale testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled}
      scaleTo={0.9} style={[s.btn, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, disabled && s.disabled]}>
      <Icon name={icon} size={Math.round(size * 0.48)} color={fg} />
    </PressableScale>
  );
}

const useStyles = makeStyles(() => ({
  btn: { alignItems: "center", justifyContent: "center" },
  disabled: { opacity: 0.45 },
}));
