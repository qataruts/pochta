import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radius } from "../../constants/theme";

export function Button({
  title,
  onPress,
  disabled,
  busy,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
  variant?: "primary" | "ghost";
}) {
  const ghost = variant === "ghost";
  return (
    <Pressable
      style={[s.btn, ghost && s.ghost, (disabled || busy) && s.off]}
      onPress={onPress}
      disabled={disabled || busy}
    >
      {busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[s.text, ghost && s.ghostText]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Link({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.link}>
      <Text style={s.linkText}>{title}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, padding: 15, alignItems: "center" },
  ghost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.line },
  off: { opacity: 0.6 },
  text: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ghostText: { color: colors.text },
  link: { padding: 12, alignItems: "center" },
  linkText: { color: colors.muted, fontSize: 14 },
});
