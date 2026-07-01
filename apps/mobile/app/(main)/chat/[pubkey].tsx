import { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text as RNText, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Composer, MessageBubble, Screen } from "../../../components";
import { useLocales } from "../../../locales";
import { useMessenger } from "../../../contexts";
import { colors, space } from "../../../constants/theme";

export default function Chat() {
  const { t } = useLocales();
  const { pubkey } = useLocalSearchParams<{ pubkey: string }>();
  const m = useMessenger();
  const contact = m.contacts.find((c) => c.pubkey === pubkey);
  // Re-read on every message change (m.tick) — cheap synchronous MMKV read.
  const messages = pubkey ? m.messagesFor(pubkey) : [];
  void m.tick;

  useEffect(() => {
    m.setActive(pubkey ?? null);
    return () => m.setActive(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubkey]);

  return (
    <Screen>
      <View style={s.bar}>
        <Pressable onPress={() => router.back()}>
          <RNText style={s.back}>‹ {t("common.back")}</RNText>
        </Pressable>
        <RNText style={s.title} numberOfLines={1}>
          {contact?.name ?? "chat"}
        </RNText>
        <RNText style={s.status}>{m.status}</RNText>
      </View>
      <FlatList
        data={messages}
        keyExtractor={(msg) => msg.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => <MessageBubble msg={item} />}
      />
      <Composer onSend={(text) => pubkey && m.send(pubkey, text)} />
    </Screen>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: space.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { color: colors.muted, fontSize: 15 },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1, textAlign: "center" },
  status: { color: colors.muted, fontSize: 12 },
  list: { padding: 12, gap: 6 },
});
