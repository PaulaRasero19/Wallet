import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Plus, SendHorizontal } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LiquidGradientBackground } from "../src/components/home/LiquidGradientBackground";
import { clearAiChatHistory, StoredChatMessage } from "../src/services/aiChatHistory";
import { askFinFlowAi } from "../src/services/aiService";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, layout, spacing, typography } from "../src/theme";

const prompts = [
  "¿Cuánto puedo gastar por día?",
  "¿En qué gasté más?",
  "¿Cómo puedo ahorrar?",
  "¿Voy a cumplir mi meta?",
  "¿Cuáles son mis gastos hormiga?"
];
const promptRows = [
  [[prompts[0], 1.22], [prompts[1], 0.78]],
  [[prompts[2], 1], [prompts[3], 1]],
  [[prompts[4], 0]]
] as const;

function makeId() {
  return `${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

async function withTimeout<T>(promise: Promise<T>, milliseconds = 20_000) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), milliseconds))
  ]);
}

export default function Insights() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<StoredChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingText, setSendingText] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const profile = useSessionStore((state) => state.profile);
  const authUser = useSessionStore((state) => state.authUser);
  const firstName = String(profile?.full_name || "").trim().split(" ")[0];
  const userId = authUser?.id || "";

  useFocusEffect(useCallback(() => {
    setMessages([]);
    setQuestion("");
    setLoading(false);
    setSendingText("");
  }, []));

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [messages]);

  async function send(value = question, appendUser = true) {
    const text = value.trim();
    if (!text || loading || text === sendingText) return;
    const userMessage: StoredChatMessage = { id: makeId(), role: "user", text, type: "message" };
    const context = messages
      .filter((item) => item.type !== "error")
      .map(({ role, text: messageText }) => ({ role, text: messageText }));
    setQuestion("");
    setSendingText(text);
    setLoading(true);
    if (appendUser) setMessages((current) => [...current, userMessage]);
    try {
      const response = await withTimeout(askFinFlowAi(text, context));
      setMessages((current) => [...current, {
        blocks: response.blocks,
        id: makeId(),
        role: "assistant",
        text: response.text,
        type: "message"
      }]);
    } catch {
      setMessages((current) => [...current, {
        id: makeId(),
        retryText: text,
        role: "assistant",
        text: "No pude responder en este momento. Probá nuevamente.",
        type: "error"
      }]);
    } finally {
      setLoading(false);
      setSendingText("");
    }
  }

  function newConversation() {
    Alert.alert("Nueva conversación", "¿Querés borrar solamente el historial de este chat?", [
      { style: "cancel", text: "Cancelar" },
      {
        style: "destructive",
        text: "Borrar chat",
        onPress: () => void (async () => {
          await clearAiChatHistory(userId);
          setMessages([]);
          setQuestion("");
        })()
      }
    ]);
  }

  const sendDisabled = !question.trim() || loading || question.trim() === sendingText;
  const hasConversation = messages.length > 0 || loading;

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safe}>
      <View pointerEvents="none" style={styles.gradientBackground}>
        <LiquidGradientBackground sampleOffsetX={0.04} sampleOffsetY={0.04} sampleScaleX={0.46} sampleScaleY={0.46} />
      </View>
      <LinearGradient
        colors={["rgba(28,28,27,0.08)", "rgba(28,28,27,0.34)", "rgba(28,28,27,0.94)", "#1C1C1B"]}
        locations={[0, 0.3, 0.57, 0.7]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboard}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Volver" accessibilityRole="button" onPress={() => router.back()} style={styles.roundButton}>
            <ChevronLeft color={colors.white} size={22} strokeWidth={2.2} />
          </Pressable>
          <Text style={styles.headerTitle}>IA FinFlow</Text>
          <Pressable accessibilityLabel="Nueva conversación" accessibilityRole="button" onPress={newConversation} style={styles.roundButton}>
            <Plus color={colors.white} size={22} strokeWidth={2.2} />
          </Pressable>
        </View>

        {!hasConversation ? (
          <View style={styles.welcome}>
            <Text style={styles.welcomeTitle}>Hola{firstName ? `, ${firstName}` : ""}!</Text>
            <Text style={styles.welcomeTitle}>¿Cómo te puedo ayudar?</Text>
            <View style={styles.suggestions}>
              {promptRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.suggestionRow}>
                  {row.map(([prompt, flex]) => (
                    <Pressable
                      accessibilityRole="button"
                      disabled={loading}
                      key={prompt}
                      onPress={() => void send(prompt)}
                      style={({ pressed }) => [
                        styles.prompt,
                        flex ? { flex } : styles.lastPrompt,
                        pressed && styles.promptPressed
                      ]}
                    >
                      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.promptText}>{prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.threadContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          style={styles.thread}
        >
          {messages.map((message) => (
            <Bubble
              key={message.id}
              message={message}
              onRetry={message.retryText ? () => void send(message.retryText, false) : undefined}
            />
          ))}
          {loading ? <TypingBubble /> : null}
        </ScrollView>

        <View style={styles.composer}>
          <View style={styles.inputPill}>
            <TextInput
              accessibilityLabel="Preguntale a FinFlow"
              autoCapitalize="sentences"
              editable={!loading}
              onChangeText={setQuestion}
              onSubmitEditing={() => void send()}
              placeholder="Preguntale a FinFlow..."
              placeholderTextColor="#777775"
              returnKeyType="send"
              style={styles.input}
              value={question}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={sendDisabled}
            onPress={() => void send()}
            style={({ pressed }) => [styles.send, sendDisabled && styles.sendDisabled, pressed && !sendDisabled && styles.sendPressed]}
          >
            <SendHorizontal color="#1C1C1B" fill="#1C1C1B" size={19} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message, onRetry }: { message: StoredChatMessage; onRetry?: () => void }) {
  const mine = message.role === "user";
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrance, {
      damping: 18,
      mass: 0.65,
      stiffness: 180,
      toValue: 1,
      useNativeDriver: true
    }).start();
  }, [entrance]);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        mine && styles.userMessageRow,
        {
          opacity: entrance,
          transform: [
            { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
            { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }
          ]
        }
      ]}
    >
      {!mine ? <View style={styles.avatar} /> : null}
      <View style={[styles.bubble, mine ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.bubbleText, mine && styles.userText]}>{message.text}</Text>
        {message.blocks?.map((block) => (
          <View key={block.title} style={styles.block}>
            <Text style={[styles.blockTitle, mine && styles.userText]}>{block.title}</Text>
            {block.rows.map((row) => <Text key={row} style={[styles.blockRow, mine && styles.userText]}>{row}</Text>)}
          </View>
        ))}
        {onRetry ? (
          <Pressable accessibilityRole="button" onPress={onRetry}>
            <Text style={styles.retry}>Reintentar</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

function TypingBubble() {
  const entrance = useRef(new Animated.Value(0)).current;
  const values = useRef([new Animated.Value(0.25), new Animated.Value(0.25), new Animated.Value(0.25)]).current;

  useEffect(() => {
    Animated.spring(entrance, { damping: 16, stiffness: 180, toValue: 1, useNativeDriver: true }).start();
    const animation = Animated.loop(Animated.stagger(150, values.map((value) => Animated.sequence([
      Animated.timing(value, { duration: 240, toValue: 1, useNativeDriver: true }),
      Animated.timing(value, { duration: 240, toValue: 0.25, useNativeDriver: true })
    ]))));
    animation.start();
    return () => animation.stop();
  }, [entrance, values]);

  return (
    <Animated.View
      accessibilityLabel="FinFlow está escribiendo"
      style={[styles.messageRow, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}
    >
      <View style={styles.avatar} />
      <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
        <View style={styles.typing}>
          {values.map((value, index) => <Animated.Text key={index} style={[styles.typingDot, { opacity: value }]}>•</Animated.Text>)}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  assistantBubble: {
    backgroundColor: "#585856"
  },
  avatar: {
    backgroundColor: "#E5E5E5",
    borderRadius: 21,
    height: 42,
    width: 42
  },
  block: {
    borderTopColor: "rgba(255,255,255,0.22)",
    borderTopWidth: 1,
    gap: 4,
    marginTop: spacing.sm,
    paddingTop: spacing.sm
  },
  blockRow: {
    ...typography.label,
    color: "rgba(255,255,255,0.76)"
  },
  blockTitle: {
    ...typography.label,
    color: colors.white,
    fontWeight: "900"
  },
  bubble: {
    borderRadius: 22,
    maxWidth: "82%",
    paddingHorizontal: 16,
    paddingVertical: 11
  },
  bubbleText: {
    ...typography.body,
    color: colors.white
  },
  composer: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 8,
    paddingBottom: 24,
    paddingHorizontal: 22,
    paddingTop: 10
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ rotate: "180deg" }]
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 22,
    paddingTop: layout.mainScreenTop
  },
  headerTitle: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    fontWeight: "800",
    marginLeft: 12
  },
  input: {
    ...typography.body,
    color: colors.white,
    maxHeight: 96,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  inputPill: {
    backgroundColor: "#3D3D3B",
    borderRadius: 24,
    flex: 1,
    justifyContent: "center",
    minHeight: 44
  },
  keyboard: {
    flex: 1
  },
  messageRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    width: "100%"
  },
  prompt: {
    backgroundColor: "rgba(82,82,80,0.88)",
    borderRadius: 22,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  promptPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }]
  },
  promptText: {
    ...typography.body,
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    textAlign: "center"
  },
  retry: {
    ...typography.label,
    color: colors.white,
    fontWeight: "900",
    marginTop: spacing.sm
  },
  roundButton: {
    alignItems: "center",
    backgroundColor: "#20201F",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  safe: {
    backgroundColor: colors.black,
    flex: 1
  },
  send: {
    alignItems: "center",
    backgroundColor: "#E5E5E5",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  sendDisabled: {
    opacity: 0.42
  },
  sendPressed: {
    transform: [{ scale: 0.92 }]
  },
  suggestions: {
    gap: 8,
    marginTop: 34,
    maxWidth: 390,
    width: "100%"
  },
  suggestionRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    width: "100%"
  },
  lastPrompt: {
    paddingHorizontal: 22
  },
  thread: {
    flex: 1,
    marginTop: 28
  },
  threadContent: {
    flexGrow: 1,
    paddingBottom: 18,
    paddingHorizontal: 22
  },
  typing: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    height: 22
  },
  typingBubble: {
    minWidth: 66
  },
  typingDot: {
    ...typography.title,
    color: colors.white,
    lineHeight: 22
  },
  userBubble: {
    backgroundColor: "#FFFFFF"
  },
  userMessageRow: {
    justifyContent: "flex-end"
  },
  userText: {
    color: "#1C1C1B"
  },
  welcome: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 142
  },
  welcomeTitle: {
    ...typography.title,
    color: colors.white,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    textAlign: "center"
  }
});
