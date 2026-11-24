import type { ComponentProps } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/theme";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/** Ionicons with the theme's ink colour by default. */
export function Icon({ name, size = 18, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.colors.ink} />;
}
