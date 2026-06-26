import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadJson(key, fallbackValue) {
  const storedValue = await AsyncStorage.getItem(key);

  if (!storedValue) {
    return fallbackValue;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    return fallbackValue;
  }
}
