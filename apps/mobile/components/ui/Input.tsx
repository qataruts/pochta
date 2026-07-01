import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { colors, radius } from "../../constants/theme";

export function Input(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.muted} style={s.input} {...props} />;
}

const s = StyleSheet.create({
  input: {
    backgroundColor: colors.panel,
    color: colors.text,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
});
