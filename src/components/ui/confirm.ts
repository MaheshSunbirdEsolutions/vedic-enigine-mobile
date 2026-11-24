import { Alert, Platform } from "react-native";

/** Cross-platform yes/no confirm (Alert has no buttons on web). */
export function confirmAsync(message: string, okLabel: string, cancelLabel: string): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(globalThis.confirm?.(message) ?? true);
  return new Promise((resolve) =>
    Alert.alert(message, undefined, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      { text: okLabel, style: "destructive", onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}
