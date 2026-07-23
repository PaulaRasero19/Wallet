import AsyncStorage from "@react-native-async-storage/async-storage";
import { AiBlock } from "./aiService";

export type StoredChatMessage = {
  blocks?: AiBlock[];
  id: string;
  retryText?: string;
  role: "assistant" | "user";
  text: string;
  type?: "error" | "message";
};

function key(userId: string) {
  return `finflow:ai-chat:${userId}`;
}

export async function loadAiChatHistory(userId: string) {
  if (!userId) return [] as StoredChatMessage[];
  const value = await AsyncStorage.getItem(key(userId));
  if (!value) return [] as StoredChatMessage[];
  try {
    const rows = JSON.parse(value);
    return Array.isArray(rows) ? rows as StoredChatMessage[] : [];
  } catch {
    return [] as StoredChatMessage[];
  }
}

export async function saveAiChatHistory(userId: string, messages: StoredChatMessage[]) {
  if (!userId) return;
  await AsyncStorage.setItem(key(userId), JSON.stringify(messages.slice(-80)));
}

export async function clearAiChatHistory(userId: string) {
  if (!userId) return;
  await AsyncStorage.removeItem(key(userId));
}
