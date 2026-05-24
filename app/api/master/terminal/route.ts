import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { isControlTotalOwner } from "@/lib/auth/control-total";
import { createAdminClient } from "@/lib/supabase/admin";
import { getManagedQueues } from "@/lib/queue/connection";

type CommandResult = {
  ok: boolean;
  output: string;
};

function parseLimit(token: string | undefined, defaultValue: number, maxValue: number) {
  const value = Number(token ?? defaultValue);
  if (!Number.isFinite(value) || value <= 0) return defaultValue;
  return Math.min(Math.floor(value), maxValue);
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}

type SubscriptionRow = {
  empresa_id: string;
  plano: string;
  status: string;
  created_at: string;
};

function pickCurrentSubscription(rows: SubscriptionRow[]) {
  const activeRows = rows.filter((row) => ["active", "trialing"].includes(String(row.status).toLowerCase()));
  const source = activeRows.length > 0 ? activeRows : rows;
  return source[0] ?? null;
}

const OPEN_ALERT_STATUS_FILTER = "status.is.null,status.eq.open,status.eq.in_progress";

async function buildQueueStatus() {
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

  const lines = stats.map(
    (item) =>
      `${item.queue}: waiting=${item.waiting} active=${item.active} failed=${item.failed} delayed=${item.delayed} completed=${item.completed}`,
  );
  return lines.join("\n");
}

async function executeCommand(rawCommand: string): Promise<CommandResult> {
  const admin = createAdminClient();
  const [commandName, ...args] = rawCommand.trim().split(/\s+/);
  const command = commandName.toLowerCase();

  if (!command || command === "help") {
    return {
      ok: true,
      output: [
        "Comandos disponíveis:",
        "help                    -> lista comandos",
        "status                  -> resumo geral da plataforma",
        "queue                   -> métricas das filas/worker",
        "alerts [n]              -> alertas de segurança recentes (high)",
        "tickets [n]             -> tickets de suporte abertos",
        "tenants [n]             -> empresas com plano/status",
        "logs [n]                -> trilha recente de auditoria MASTER",
      ].join("\n"),
    };
  }

  if (command === "queue") {
    const queueOutput = await buildQueueStatus();
    return { ok: true, output: queueOutput || "Nenhuma fila gerenciada encontrada." };
  }

  if (command === "status") {
    const [securityHighRes, openTicketsRes, empresaRes, queueOutput] = await Promise.all([
      admin
        .from("security_alerts")
        .select("id", { head: true, count: "exact" })
        .eq("severity", "high")
        .or(OPEN_ALERT_STATUS_FILTER),
      admin
        .from("support_tickets")
        .select("id", { head: true, count: "exact" })
        .in("status", ["aberto", "em_andamento", "aguardando_cliente"]),
      admin.from("empresas").select("id", { head: true, count: "exact" }),
      buildQueueStatus(),
    ]);
    if (securityHighRes.error) throw new Error(securityHighRes.error.message);
    if (openTicketsRes.error) throw new Error(openTicketsRes.error.message);
    if (empresaRes.error) throw new Error(empresaRes.error.message);

    return {
      ok: true,
      output: [
        "Plataforma: ONLINE",
        `Empresas: ${empresaRes.count ?? 0}`,
        `Alertas high: ${securityHighRes.count ?? 0}`,
        `Tickets abertos: ${openTicketsRes.count ?? 0}`,
        "",
        "Filas:",
        queueOutput || "Sem filas registradas.",
      ].join("\n"),
    };
  }

  if (command === "alerts") {
    const limit = parseLimit(args[0], 10, 100);
    const { data, error } = await admin
      .from("security_alerts")
      .select("id, category, severity, status, reason, created_at")
      .eq("severity", "high")
      .or(OPEN_ALERT_STATUS_FILTER)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return { ok: true, output: "Sem alertas high recentes." };

    return {
      ok: true,
      output: data
        .map((item) => `${formatDate(item.created_at)} | ${item.category} | ${item.status} | ${item.reason}`)
        .join("\n"),
    };
  }

  if (command === "tickets") {
    const limit = parseLimit(args[0], 10, 100);
    const [ticketsRes, empresasRes] = await Promise.all([
      admin
        .from("support_tickets")
        .select("id, empresa_id, title, priority, status, created_at")
        .in("status", ["aberto", "em_andamento", "aguardando_cliente"])
        .order("created_at", { ascending: false })
        .limit(limit),
      admin.from("empresas").select("id, nome"),
    ]);
    if (ticketsRes.error) throw new Error(ticketsRes.error.message);
    const empresaMap = new Map<string, string>();
    for (const item of empresasRes.data ?? []) {
      empresaMap.set(item.id, item.nome);
    }
    if (!ticketsRes.data || ticketsRes.data.length === 0) return { ok: true, output: "Sem tickets abertos." };

    return {
      ok: true,
      output: ticketsRes.data
        .map(
          (item) =>
            `${formatDate(item.created_at)} | ${empresaMap.get(item.empresa_id) ?? "Empresa"} | ${item.priority} | ${
              item.status
            } | ${item.title}`,
        )
        .join("\n"),
    };
  }

  if (command === "tenants") {
    const limit = parseLimit(args[0], 10, 100);
    const [empresasRes, assinaturasRes, profilesRes] = await Promise.all([
      admin.from("empresas").select("id, nome, created_at").order("created_at", { ascending: false }).limit(limit),
      admin
        .from("assinaturas")
        .select("empresa_id, plano, status, created_at")
        .order("created_at", { ascending: false }),
      admin.from("profiles").select("empresa_id"),
    ]);
    if (empresasRes.error) throw new Error(empresasRes.error.message);
    if (assinaturasRes.error) throw new Error(assinaturasRes.error.message);
    if (profilesRes.error) throw new Error(profilesRes.error.message);

    const assMap = new Map<string, SubscriptionRow[]>();
    for (const item of assinaturasRes.data ?? []) {
      const list = assMap.get(item.empresa_id) ?? [];
      list.push(item as SubscriptionRow);
      assMap.set(item.empresa_id, list);
    }
    const profileCountMap = new Map<string, number>();
    for (const item of profilesRes.data ?? []) {
      profileCountMap.set(item.empresa_id, (profileCountMap.get(item.empresa_id) ?? 0) + 1);
    }

    return {
      ok: true,
      output: (empresasRes.data ?? [])
        .map((item) => {
          const assinatura = pickCurrentSubscription(assMap.get(item.id) ?? []);
          return `${item.nome} | plano=${assinatura?.plano ?? "trial"} | status=${assinatura?.status ?? "trial"} | usuarios=${
            profileCountMap.get(item.id) ?? 0
          } | criado=${formatDate(item.created_at)}`;
        })
        .join("\n"),
    };
  }

  if (command === "logs") {
    const limit = parseLimit(args[0], 20, 200);
    const { data, error } = await admin
      .from("master_audit_logs")
      .select("created_at, actor_email, action, target_type, target_id")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return { ok: true, output: "Sem logs de auditoria." };

    return {
      ok: true,
      output: data
        .map(
          (item) =>
            `${formatDate(item.created_at)} | ${item.actor_email ?? "sistema"} | ${item.action} | ${item.target_type}${
              item.target_id ? `:${item.target_id}` : ""
            }`,
        )
        .join("\n"),
    };
  }

  return { ok: false, output: `Comando inválido: ${command}. Use 'help'.` };
}

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!isControlTotalOwner(profile)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { command?: string } | null;
  const command = String(body?.command ?? "").trim();
  if (!command) {
    return NextResponse.json({ error: "Comando obrigatório" }, { status: 400 });
  }

  try {
    const result = await executeCommand(command);
    const admin = createAdminClient();
    const { error: auditError } = await admin.from("master_audit_logs").insert({
      actor_profile_id: profile?.id ?? null,
      actor_email: profile?.email ?? null,
      action: "terminal_comando_executado",
      target_type: "terminal",
      target_id: null,
      empresa_id: null,
      details: {
        command,
        ok: result.ok,
      },
    });
    if (auditError) throw new Error(`Erro ao registrar auditoria: ${auditError.message}`);

    return NextResponse.json({
      ok: result.ok,
      command,
      output: result.output,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao executar comando";
    return NextResponse.json(
      {
        ok: false,
        command,
        output: `Erro: ${message}`,
        executedAt: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
