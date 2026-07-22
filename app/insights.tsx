import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SendHorizontal } from "lucide-react-native";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { askFinFlowAi, AiBlock } from "../src/services/aiService";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";

const prompts = [
  "¿Cuánto puedo gastar por día?",
  "¿En qué gasté más?",
  "¿Voy a cumplir mi meta?",
  "¿Qué tengo comprometido?",
  "¿Cuáles son mis gastos hormiga?",
  "¿Cómo puedo ahorrar?"
];

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  blocks?: AiBlock[];
};

function makeId() {
  return `${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export default function Insights() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { loadOverview } = useFinFlowStore();
  const profile = useSessionStore((state) => state.profile);
  const firstName = String(profile?.full_name || "Lucía").split(" ")[0];

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages]);

  async function ask(value = question) {
    const text = value.trim();
    if (!text || loading) return;
    setQuestion("");
    setLoading(true);
    setMessages((current) => [...current, { id: makeId(), role: "user", text }]);
    try {
      const response = await askFinFlowAi(text);
      setMessages((current) => [...current, { blocks: response.blocks, id: makeId(), role: "assistant", text: response.text }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          text: error instanceof Error ? error.message : "No pude responder ahora. Probá de nuevo en unos segundos."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <Header title="IA FinFlow" />
      <View style={styles.intro}>
        <Text style={styles.introTitle}>Hola {firstName}.</Text>
        <Text style={styles.introText}>Puedo analizar tus movimientos, tus metas, tus tarjetas y tus próximos pagos.</Text>
      </View>
      <View style={styles.suggestions}>
        {prompts.map((prompt) => (
          <Pressable accessibilityRole="button" key={prompt} onPress={() => ask(prompt)} style={styles.prompt}>
            <Text style={styles.promptText}>{prompt}</Text>
          </Pressable>
        ))}
      </View>
      <ScrollView ref={scrollRef} scrollEnabled={false} style={styles.thread}>
        {messages.length ? (
          messages.map((message) => <Bubble key={message.id} message={message} />)
        ) : (
          <Bubble message={{ id: "initial", role: "assistant", text: "Preguntame algo concreto. Si falta información, te lo voy a decir en vez de inventar datos." }} />
        )}
        {loading ? <Bubble message={{ id: "loading", role: "assistant", text: "Analizando tus datos..." }} /> : null}
      </ScrollView>
      <View style={styles.inputBar}>
        <TextInput
          accessibilityLabel="Preguntale a FinFlow"
          autoCapitalize="sentences"
          onChangeText={setQuestion}
          onSubmitEditing={() => ask()}
          placeholder="Preguntale a FinFlow..."
          placeholderTextColor={colors.grayMedium}
          style={styles.input}
          value={question}
        />
        <Pressable accessibilityRole="button" onPress={() => ask()} style={styles.send}>
          <SendHorizontal color={colors.black} size={18} />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.role === "user";
  return (
    <View style={[styles.bubble, mine && styles.userBubble]}>
      <Text style={[styles.bubbleText, mine && styles.userText]}>{message.text}</Text>
      {message.blocks?.map((block) => (
        <View key={block.title} style={styles.block}>
          <Text style={styles.blockTitle}>{block.title}</Text>
          {block.rows.map((row) => (
            <Text key={row} style={styles.blockRow}>{row}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderTopColor: colors.appGrayBorder,
    borderTopWidth: 1,
    gap: 4,
    marginTop: spacing.md,
    paddingTop: spacing.sm
  },
  blockRow: {
    ...typography.label,
    color: colors.transparentWhite
  },
  blockTitle: {
    ...typography.label,
    color: colors.white,
    fontWeight: "900"
  },
  bubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.sm,
    maxWidth: "92%",
    padding: spacing.md
  },
  bubbleText: {
    ...typography.body,
    color: colors.white
  },
  input: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  inputBar: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: 4
  },
  intro: {
    marginTop: spacing.lg
  },
  introText: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.xs
  },
  introTitle: {
    ...typography.title,
    color: colors.white
  },
  prompt: {
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  promptText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "800"
  },
  send: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  thread: {
    marginTop: spacing.xl,
    maxHeight: 380
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  userText: {
    color: colors.black
  }
});
