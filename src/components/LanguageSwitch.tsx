/**
 * Compact EN / हि switch, shown on the right of every screen header.
 * The thumb moves at once; the app cross-fades into the new language (see I18nProvider).
 */
import { StyleSheet, View } from "react-native";
import { SegmentedControl } from "@/components/ui";
import { useI18n } from "@/i18n/I18nProvider";
import type { Lang } from "@/types/api";

const SEGMENTS: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "hi", label: "हि" },
];

export function LanguageSwitch() {
  const { targetLang, setLang, t } = useI18n();
  return (
    <View accessibilityLabel={t("settings_language")} style={styles.wrap}>
      <SegmentedControl<Lang> size="sm" testID="header-lang" value={targetLang} onChange={setLang} segments={SEGMENTS} />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { marginRight: 4 } });
