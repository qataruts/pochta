import { type ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, space } from "../../constants/theme";

export function Screen({ children }: { children: ReactNode }) {
  return <SafeAreaView style={s.screen}>{children}</SafeAreaView>;
}

export function Centered({ children }: { children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={s.centered} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  centered: { flexGrow: 1, justifyContent: "center", padding: space.xl, gap: space.md },
});
