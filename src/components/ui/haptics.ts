/** Light haptic feedback on iOS/Android; silently does nothing on web or if unavailable. */
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function tapFeedback(kind: "selection" | "light" | "success" | "warning" = "light"): void {
  if (Platform.OS === "web") return;
  const p =
    kind === "selection" ? Haptics.selectionAsync()
    : kind === "success" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    : kind === "warning" ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  p.catch(() => {});
}
