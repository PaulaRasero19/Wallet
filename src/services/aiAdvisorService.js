function buildLocalAdvice(question) {
  return {
    source: "Motor IA local",
    summary: "Necesitamos mas movimientos reales para ofrecer un analisis personalizado.",
    riskLevel: "Sin datos",
    answer: question
      ? `No puedo responder "${question}" con datos inventados.`
      : "FinFlow no genera insights financieros sin datos reales.",
    recommendedActions: ["Conectar datos reales desde Supabase en las proximas fases."],
    notificationSuggestion: "Sin sugerencias hasta tener datos reales."
  };
}

export async function generateAdvisorResult(question) {
  return buildLocalAdvice(question);
}
