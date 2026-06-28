import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { getRequestIpFromHeaders, isMasterIpAllowed } from "@/lib/auth/master-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { getEnv } from "@/lib/validations/env";
import { getManagedQueues } from "@/lib/queue/connection";

type SupportChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type OpsAction = "ack_high_alerts";

type RequestBody = {
  message?: string;
  history?: SupportChatTurn[];
  action?: OpsAction;
};

type QueueStat = {
  queue: string;
  active: number;
  completed: number;
  delayed: number;
  failed: number;
  waiting: number;
};

type AlertRow = {
  id: string;
  category: string;
  severity: string;
  reason: string;
  status: "open" | "in_progress" | "resolved" | "ignored";
  metadata: Record<string, unknown>;
  created_at: string;
};

type TicketRow = {
  id: string;
  empresa_id: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
};

function normalizeHistory(input: unknown): SupportChatTurn[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is SupportChatTurn => {
      if (!item || typeof item !== "object") return false;
      const row = item as SupportChatTurn;
      return (row.role === "user" || row.role === "assistant") && typeof row.content === "string";
    })
    .slice(-8);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function loadQueueStats(): Promise<{ stats: QueueStat[]; note: string | null }> {
  try {
    const queues = getManagedQueues();
    const stats = await Promise.all(
      queues.map(async (queue) => {
        const counts = await queue.getJobCounts("active", "completed", "delayed", "failed", "waiting");
        return {
          queue: queue.name,
          active: counts.active ?? 0,
          completed: counts.completed ?? 0,
          delayed: counts.delayed ?? 0,
          failed: counts.failed ?? 0,
          waiting: counts.waiting ?? 0,
        };
      }),
    );
    return { stats, note: null };
  } catch {
    return { stats: [], note: "Fila/Redis indisponível no ambiente." };
  }
}

async function loadContext() {
  const admin = createAdminClient();
  const [alertsRes, ticketsRes, empresasRes, queueRes, auditRes] = await Promise.all([
    admin
      .from("security_alerts")
      .select("id, category, severity, reason, metadata, created_at")
      .in("severity", ["high", "medium"])
      .order("created_at", { ascending: false })
      .limit(12),
    admin
      .from("support_tickets")
      .select("id, empresa_id, title, priority, status, created_at")
      .in("status", ["aberto", "em_andamento", "aguardando_cliente"])
      .order("created_at", { ascending: false })
      .limit(10),
    admin.from("empresas").select("id", { head: true, count: "exact" }),
    loadQueueStats(),
    admin
      .from("master_audit_logs")
      .select("created_at, actor_email, action, target_type, target_id")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (alertsRes.error) throw new Error(alertsRes.error.message);
  if (ticketsRes.error) throw new Error(ticketsRes.error.message);
  if (empresasRes.error) throw new Error(empresasRes.error.message);
  if (auditRes.error) throw new Error(auditRes.error.message);

  const alerts = (alertsRes.data ?? []).map((item) => {
    const metadata = ((item.metadata ?? {}) as Record<string, unknown>) ?? {};
    const rawStatus = String(metadata.remediation_status ?? "open").toLowerCase();
    const status: AlertRow["status"] =
      rawStatus === "in_progress" || rawStatus === "resolved" || rawStatus === "ignored" ? rawStatus : "open";
    return {
      id: item.id,
      category: item.category,
      severity: item.severity,
      reason: item.reason,
      status,
      metadata,
      created_at: item.created_at,
    };
  }) as AlertRow[];
  const tickets = (ticketsRes.data ?? []) as TicketRow[];
  const highAlerts = alerts.filter((alert) => alert.severity === "high");
  const queueFailures = queueRes.stats.reduce((sum, item) => sum + item.failed, 0);
  const queueWaiting = queueRes.stats.reduce((sum, item) => sum + item.waiting, 0);

  return {
    summary: {
      companies: empresasRes.count ?? 0,
      alerts: alerts.length,
      highAlerts: highAlerts.length,
      openTickets: tickets.length,
      queueFailures,
      queueWaiting,
    },
    alerts,
    tickets,
    queues: queueRes.stats,
    queueNote: queueRes.note,
    audits: (auditRes.data ?? []).map((item) => ({
      when: formatDate(item.created_at),
      actor: item.actor_email ?? "sistema",
      action: item.action,
      target: `${item.target_type}${item.target_id ? `:${item.target_id}` : ""}`,
    })),
  };
}

async function generateReply(message: string, context: Awaited<ReturnType<typeof loadContext>>, history: SupportChatTurn[]) {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) return null;

  const input = [
    {
      role: "system",
      content:
        [
          "Você é o assistente de operações do ObrasCitY.",
          "Responda em português do Brasil, de forma objetiva e operacional.",
          "Você analisa alertas, filas, tickets e auditoria.",
          "Nunca sugira ações destrutivas ou irreversíveis sem aprovação humana.",
          "Quando houver risco alto, recomende triagem, abertura de ticket e revisão manual.",
          "Quando couber, sugira ações seguras: abrir ticket, marcar alertas como em análise, revisar filas e consultar auditoria.",
        ].join(" "),
    },
    {
      role: "system",
      content: `Contexto atual: ${JSON.stringify(context.summary)}`,
    },
    ...history.map((turn) => ({ role: turn.role, content: turn.content })),
    {
      role: "user",
      content:
        message ||
        "Faça um diagnóstico operacional do ambiente agora e diga quais problemas merecem triagem imediata, com ações seguras sugeridas.",
    },
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

function fallbackReply(context: Awaited<ReturnType<typeof loadContext>>) {
  const topQueue = context.queues.find((item) => item.failed > 0 || item.waiting > 0);
  const lines = [
    `Ambiente com ${context.summary.highAlerts} alertas high, ${context.summary.openTickets} tickets em aberto e ${context.summary.queueFailures} falhas em fila.`,
    topQueue
      ? `Fila crítica: ${topQueue.queue} (waiting=${topQueue.waiting}, failed=${topQueue.failed}).`
      : "Filas sem pico crítico detectado no momento.",
    "",
    "Ações seguras sugeridas:",
    "1. Abrir/atualizar ticket de incidente para o alerta mais recente.",
    "2. Marcar alertas high como em triagem para rastreamento.",
    "3. Revisar a fila/worker e a trilha de auditoria antes de intervir.",
  ];
  return lines.join("\n");
}

async function acknowledgeHighAlerts() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("security_alerts")
    .select("id, metadata")
    .eq("severity", "high");

  if (error) {
    throw new Error(error.message);
  }

  let updated = 0;
  for (const alert of data ?? []) {
    const metadata = (alert.metadata ?? {}) as Record<string, unknown>;
    const currentStatus = String(metadata.remediation_status ?? "open").toLowerCase();
    if (currentStatus !== "open") continue;

    const updatePayload = {
      status: "in_progress",
      metadata: {
        ...metadata,
        remediation_status: "in_progress",
        remediation_note: "Triagem automática pelo assistente de operações",
      },
    };

    let { error: updateError } = await admin
      .from("security_alerts")
      .update(updatePayload)
      .eq("id", alert.id);

    if (updateError && updateError.message.toLowerCase().includes("status")) {
      ({ error: updateError } = await admin
        .from("security_alerts")
        .update({
          metadata: updatePayload.metadata,
        })
        .eq("id", alert.id));
    }

    if (updateError) {
      throw new Error(updateError.message);
    }
    updated += 1;
  }

  return updated;
}

function classifyRisk(message: string, context: Awaited<ReturnType<typeof loadContext>>) {
  const lower = message.toLowerCase();
  if (context.summary.highAlerts > 0 || lower.includes("seguranca") || lower.includes("fora do ar")) return "high";
  if (lower.includes("erro") || lower.includes("falha") || lower.includes("alerta")) return "medium";
  return "low";
}

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!isControlTotalOwner(profile)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  if (!isMasterIpAllowed(getRequestIpFromHeaders(request.headers))) {
    return NextResponse.json({ error: "Acesso restrito por allowlist de IP" }, { status: 403 });
  }

  const supabase = await createServerClient();
  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") {
    return NextResponse.json({ error: "MFA obrigatório para operações master." }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as RequestBody | null;
  const action = payload?.action ?? null;
  const message = String(payload?.message ?? "").trim();
  const history = normalizeHistory(payload?.history);

  try {
    const context = await loadContext();

    if (action === "ack_high_alerts") {
      const updated = await acknowledgeHighAlerts();
      const admin = createAdminClient();
      const { error: auditError } = await admin.from("master_audit_logs").insert({
        actor_profile_id: profile?.id ?? null,
        actor_email: profile?.email ?? null,
        action: "ops_ai_alertas_triagem_iniciada",
        target_type: "security_alert",
        target_id: null,
        empresa_id: null,
        details: { updated },
      });
      if (auditError) {
        throw new Error(`Erro ao registrar auditoria: ${auditError.message}`);
      }

      return NextResponse.json({
        ok: true,
        action: "ack_high_alerts",
        updatedAlerts: updated,
        answer: `Triagem iniciada para ${updated} alertas high. Eles foram marcados como "em análise" para acompanhamento.`,
        risk: "medium",
        suggestedActions: [
          { label: "Abrir Segurança", href: "/contas?tab=seguranca" },
          { label: "Ver Terminal", href: "/contas?tab=terminal" },
          { label: "Abrir Ticket", href: "/contas?tab=suporte" },
        ],
      });
    }

    const aiAnswer = await generateReply(message, context, history);
    const risk = classifyRisk(message || aiAnswer || "", context);

    const answer = aiAnswer ?? fallbackReply(context);

    return NextResponse.json({
      ok: true,
      answer,
      risk,
      summary: context.summary,
      queueNote: context.queueNote,
      suggestedActions: [
        { label: "Abrir Segurança", href: "/contas?tab=seguranca" },
        { label: "Abrir Runbooks", href: "/contas?tab=runbooks" },
        { label: "Ver Terminal", href: "/contas?tab=terminal" },
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao analisar operações" },
      { status: 500 },
    );
  }
}
