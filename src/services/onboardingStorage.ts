import AsyncStorage from "@react-native-async-storage/async-storage";

const HAS_SEEN_ONBOARDING_KEY = "finflow.has_seen_onboarding";

export async function getHasSeenOnboarding() {
  return (await AsyncStorage.getItem(HAS_SEEN_ONBOARDING_KEY)) === "true";
}

export async function setHasSeenOnboarding() {
  await AsyncStorage.setItem(HAS_SEEN_ONBOARDING_KEY, "true");
}
