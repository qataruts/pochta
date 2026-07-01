import { type ReactNode } from "react";
import { StyleSheet, Text as RNText, type StyleProp, type TextStyle } from "react-native";
import { colors } from "../../constants/theme";

type Variant = "brand" | "title" | "sub" | "label" | "muted" | "error";

export function Text({
  variant = "label",
  children,
  style,
}: {
  variant?: Variant;
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <RNText style={[s[variant], style]}>{children}</RNText>;
}

const s = StyleSheet.create({
  brand: { color: "#fff", fontSize: 34, fontWeight: "800", textAlign: "center" },
  title: { color: "#fff", fontSize: 24, fontWeight: "800", textAlign: "center" },
  sub: { color: colors.muted, fontSize: 16, textAlign: "center", lineHeight: 22 },
  label: { color: colors.text, fontSize: 14 },
  muted: { color: colors.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  error: { color: colors.accent2, textAlign: "center" },
});
