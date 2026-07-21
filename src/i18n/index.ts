import es from "./es.json";
import en from "./en.json";
import pt from "./pt.json";
import { Language } from "../services/profileService";

const dictionaries: Record<Language, Record<string, string>> = { es, en, pt };

export const languageOptions: Array<{ code: Language; label: string }> = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "pt", label: "Português" }
];

export function translate(language: Language, key: string) {
  return dictionaries[language]?.[key] || dictionaries.es[key] || key;
}
