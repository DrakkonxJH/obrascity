import { getEnv } from "@/lib/validations/env";

export type SupportChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const MODULE_HINTS: Array<{ keywords: string[]; label: string; route: string }> = [
  { keywords: ["dashboard", "painel", "indicador"], label: "Dashboard", route: "/dashboard" },
  { keywords: ["obra", "obras"], label: "Obras", route: "/obras" },
  { keywords: ["cronograma", "prazo"], label: "Cronograma", route: "/cronograma" },
  { keywords: ["financeiro", "orcamento", "custo"], label: "Financeiro", route: "/financeiro" },
  { keywords: ["equipe", "usuario", "perfil", "acesso"], label: "Equipes e Acessos", route: "/equipes" },
  { keywords: ["material", "estoque"], label: "Materiais", route: "/materiais" },
  { keywords: ["qualidade", "nao conformidade"], label: "Qualidade", route: "/qualidade" },
  { keywords: ["relatorio", "pdf", "excel", "docx"], label: "Relatórios", route: "/relatorios" },
];

function classifyRisk(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes("fora do ar") ||
    lower.includes("indisponivel") ||
    lower.includes("nao consigo entrar") ||
    lower.includes("bloqueado") ||
    lower.includes("vazamento") ||
    lower.includes("seguranca")
  ) {
    return "high";
  }
  if (lower.includes("erro") || lower.includes("falha") || lower.includes("nao funciona")) {
    return "medium";
  }
  return "low";
}

function suggestModule(message: string) {
  const lower = message.toLowerCase();
  return MODULE_HINTS.find((item) => item.keywords.some((keyword) => lower.includes(keyword))) ?? null;
}

function fallbackResponse(message: string) {
  const risk = classifyRisk(message);
  const hint = suggestModule(message);
  const base = hint
    ? `Pelo contexto, isso parece estar ligado ao módulo **${hint.label}**. Você pode validar primeiro em: ${hint.route}.`
    : "Entendi. Vou te orientar por etapas para isolar a causa e resolver com segurança.";

  const remediation =
    risk === "high"
      ? "Como isso pode impactar operação/segurança, recomendo abrir ticket imediatamente com prioridade alta para acompanhamento humano."
      : "Se quiser, eu também já abro um ticket com esse contexto para o time acompanhar.";

  return `${base}\n\n1. Confirme exatamente onde o problema ocorre (tela e ação).\n2. Tente repetir o fluxo com atualização da página e anote a mensagem de erro.\n3. Verifique se o perfil do usuário tem o papel/permissão necessária.\n4. Se persistir, envie print e horário do erro para rastreio.\n\n${remediation}`;
}

async function generateWithOpenAI(message: string, history: SupportChatTurn[]) {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) return null;

  const input = [
    {
      role: "system",
      content:
        "Você é o assistente de suporte do ObrasFlow. Responda em português do Brasil, com orientação prática e objetiva, focada em uso da plataforma de obras, segurança e operação. Se houver risco operacional ou de segurança, recomende escalonamento para ticket humano.",
    },
    ...history.slice(-8).map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    { role: "user", content: message },
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input,
      temperature: 0.2,
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { output_text?: string };
  const text = String(data.output_text ?? "").trim();
  return text || null;
}

export async function generateSupportReply(message: string, history: SupportChatTurn[]) {
  const normalizedMessage = message.trim();
  if (!normalizedMessage) {
    return {
      answer: "Envie uma dúvida para eu te ajudar.",
      risk: "low" as const,
      suggestedModule: null as { label: string; route: string } | null,
    };
  }

  const aiAnswer = await generateWithOpenAI(normalizedMessage, history);
  const risk = classifyRisk(normalizedMessage);
  const suggested = suggestModule(normalizedMessage);

  return {
    answer: aiAnswer ?? fallbackResponse(normalizedMessage),
    risk,
    suggestedModule: suggested ? { label: suggested.label, route: suggested.route } : null,
  };
}
