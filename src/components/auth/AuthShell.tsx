import type { ReactNode } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BRAND_NAME } from "@/components/BrandTitle";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Button, Card, LogoMark, Screen, Text } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { fontSets, makeStyles, spacing } from "@/theme";

export type AuthShellProps = {
  title: string;
  subtitle: string;
  testID?: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/** Standalone full-screen chrome for Sign In / Sign Up outside the tab layout. */
export function AuthShell({ title, subtitle, testID, onBack, children, footer }: AuthShellProps) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  return (
    <Screen testID={testID}>
      <View style={{ paddingTop: Math.max(insets.top, spacing.xs) }}>
        <View style={s.topBar}>
          <Button testID="auth-back" variant="ghost" size="sm" icon="arrow-back" label={t("auth_back")} onPress={onBack} />
          <LanguageSwitch />
        </View>

        <View style={s.header}>
          <LogoMark size={40} />
          <Text style={s.brand}>{BRAND_NAME}</Text>
          <Text variant="title" style={s.title}>{title}</Text>
          <Text variant="muted" style={s.subtitle}>{subtitle}</Text>
        </View>

        <Card style={s.card}>{children}</Card>
        {footer ? <View style={s.footer}>{footer}</View> : null}
      </View>
    </Screen>
  );
}

const useStyles = makeStyles((t) => ({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  header: { alignItems: "center", marginBottom: spacing.lg, paddingHorizontal: spacing.sm },
  brand: {
    marginTop: spacing.xs,
    fontFamily: fontSets.latin.display,
    fontSize: 18,
    lineHeight: 24,
    color: t.colors.ink,
    letterSpacing: Platform.OS === "ios" ? -0.2 : 0,
  },
  title: { marginTop: spacing.sm, textAlign: "center" },
  subtitle: { marginTop: spacing.xs, textAlign: "center" },
  card: { marginBottom: spacing.md },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: spacing.xs },
}));
