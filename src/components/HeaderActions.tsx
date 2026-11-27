/**
 * Header right-side controls: compact Sign in / Account pill beside the EN / हि toggle.
 */
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useAppAuth } from "@/auth/useAppAuth";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Icon, PressableScale, Text } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { makeStyles, radius, spacing, useTheme } from "@/theme";

function initialFor(fullName: string | null, email: string | null): string | null {
  const source = fullName?.trim() || email?.trim() || "";
  return source ? source[0].toUpperCase() : null;
}

export function HeaderActions() {
  const s = useStyles();
  const t = useTheme();
  const { t: tr } = useI18n();
  const router = useRouter();
  const { isConfigured, isLoaded, isSignedIn, email, fullName } = useAppAuth();

  const initial = initialFor(fullName, email);

  return (
    <View style={s.row}>
      {isConfigured && isLoaded ? (
        isSignedIn ? (
          <PressableScale
            testID="header-account"
            accessibilityRole="button"
            accessibilityLabel={tr("auth_account")}
            haptic="selection"
            onPress={() => router.navigate("/(tabs)/settings")}
            style={s.avatar}
          >
            {initial ? (
              <Text weight="semibold" style={s.avatarText}>{initial}</Text>
            ) : (
              <Icon name="person-outline" size={16} color={t.colors.accent} />
            )}
          </PressableScale>
        ) : (
          <PressableScale
            testID="header-sign-in"
            accessibilityRole="button"
            accessibilityLabel={tr("auth_sign_in")}
            haptic="selection"
            onPress={() => router.push("/(auth)/sign-in")}
            style={s.signInBtn}
          >
            <Icon name="log-in-outline" size={14} color={t.colors.onAccent} />
            <Text weight="semibold" style={s.signInText} numberOfLines={1}>{tr("auth_sign_in")}</Text>
          </PressableScale>
        )
      ) : null}
      <LanguageSwitch />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginRight: 4 },
  signInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: t.colors.accent,
  },
  signInText: { fontSize: 12.5, lineHeight: 16, color: t.colors.onAccent },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: t.colors.accentSoft,
    borderWidth: 1,
    borderColor: t.colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 13, lineHeight: 16, color: t.colors.accent },
}));
