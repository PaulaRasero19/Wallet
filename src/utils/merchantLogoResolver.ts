type MerchantLogoConfig = {
  backgroundColor: string;
  foregroundColor: string;
  initials: string;
  label: string;
};

const merchantMap: Record<string, MerchantLogoConfig> = {
  amazon: { backgroundColor: "#F3E7D8", foregroundColor: "#292927", initials: "A", label: "Amazon" },
  antel: { backgroundColor: "#EAF4FF", foregroundColor: "#006DB6", initials: "A", label: "Antel" },
  devoto: { backgroundColor: "#E8F4DF", foregroundColor: "#31723A", initials: "D", label: "Devoto" },
  disco: { backgroundColor: "#FFF2E6", foregroundColor: "#D74902", initials: "D", label: "Disco" },
  farmashop: { backgroundColor: "#F7E8F1", foregroundColor: "#B31974", initials: "F", label: "Farmashop" },
  geant: { backgroundColor: "#F4E8FF", foregroundColor: "#6A3BAA", initials: "G", label: "Géant" },
  netflix: { backgroundColor: "#F1E5E5", foregroundColor: "#B73732", initials: "N", label: "Netflix" },
  ose: { backgroundColor: "#E8F7FF", foregroundColor: "#0076A8", initials: "O", label: "OSE" },
  pedidosya: { backgroundColor: "#FFF0EC", foregroundColor: "#EF3E2D", initials: "PY", label: "PedidosYa" },
  spotify: { backgroundColor: "#E8F1E9", foregroundColor: "#2D7F42", initials: "S", label: "Spotify" },
  starbucks: { backgroundColor: "#E6F3EE", foregroundColor: "#00704A", initials: "S", label: "Starbucks" },
  stm: { backgroundColor: "#FFF5D7", foregroundColor: "#D39A00", initials: "STM", label: "STM" },
  tata: { backgroundColor: "#E8F0FF", foregroundColor: "#2252A3", initials: "T", label: "Ta-Ta" },
  uber: { backgroundColor: "#E9E7E0", foregroundColor: "#292927", initials: "U", label: "Uber" },
  ute: { backgroundColor: "#FFF2DF", foregroundColor: "#F39C12", initials: "U", label: "UTE" }
};

function normalize(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function fallbackInitials(value: string) {
  const clean = value.trim();
  if (!clean) return "FF";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

export function resolveMerchantLogo({ category, merchant, title }: { category?: string | null; merchant?: string | null; title?: string | null }): MerchantLogoConfig {
  const rawName = merchant || title || category || "Movimiento";
  const key = normalize(rawName);
  const matchKey = Object.keys(merchantMap).find((merchantKey) => key.includes(merchantKey));

  if (matchKey) return merchantMap[matchKey];

  const categoryKey = normalize(category);
  if (categoryKey.includes("transport")) {
    return { backgroundColor: "#F6F0E4", foregroundColor: "#292927", initials: "TR", label: rawName };
  }

  if (categoryKey.includes("food") || categoryKey.includes("super") || categoryKey.includes("comida")) {
    return { backgroundColor: "#FFF0EC", foregroundColor: "#D74902", initials: fallbackInitials(rawName), label: rawName };
  }

  if (categoryKey.includes("salary") || categoryKey.includes("freelance") || categoryKey.includes("ingreso")) {
    return { backgroundColor: "#E9F5DF", foregroundColor: "#4B9E33", initials: "$", label: rawName };
  }

  return {
    backgroundColor: "#E9E7E0",
    foregroundColor: "#292927",
    initials: fallbackInitials(rawName),
    label: rawName
  };
}
