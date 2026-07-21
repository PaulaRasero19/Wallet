import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const memoryStorage = new Map<string, string>();

export const secureSessionStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") {
      return memoryStorage.get(key) ?? null;
    }

    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") {
      memoryStorage.set(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web") {
      memoryStorage.delete(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  }
};
