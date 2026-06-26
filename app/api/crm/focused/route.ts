import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { getEmpresaIdFromProfile } from "@/lib/db/tenant";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PIPELINE = [
  {
    step: 1,
    sectorId: "vendas",
    stageName: "Captação & Leads",
    color: "purple",
    icon: "fa-users",
    subtasks: [
      "Validar origem e contexto do lead",
      "Realizar primeiro contato",
    ],
  },
  {
    step: 2,
    sectorId: "vendas",
    stageName: "Qualificação",
    color: "purple",
    icon: "fa-users",
    subtasks: [
      "Mapear dor principal do cliente",
      "Identificar decisor e influenciadores",
    ],
  },
  {
    step: 3,
    sectorId: "financeiro",
    stageName: "Proposta",
    color: "emerald",
    icon: "fa-file-invoice-dollar",
    subtasks: [
      "Definir escopo e premissas comerciais",
      "Enviar proposta formal",
    ],
  },
  {
    step: 4,
    sectorId: "engenharia",
    stageName: "Negociação",
    color: "fire",
    icon: "fa-hard-hat",
    subtasks: [
      "Documentar objeções e contrapartidas",
      "Definir data de decisão com cliente",
    ],
  },
  {
    step: 5,
    sectorId: "engenharia",
    stageName: "Fechamento",
    color: "fire",
    icon: "fa-hard-hat",
    subtasks: [
      "Registrar handoff para operação",
      "Agendar kickoff com cliente",
    ],
  },
] as const;

const SECTORS = [
  { id: "vendas", name: "Vendas / Comercial", icon: "fa-users", color: "purple", budgetLimit: 500000 },
  { id: "financeiro", name: "Financeiro", icon: "fa-file-invoice-dollar", color: "emerald", budgetLimit: 250000 },
  { id: "engenharia", name: "Operação / Entrega", icon: "fa-hard-hat", color: "fire", budgetLimit: 250000 },
] as const;

function mapStageToStepIndex(stage: string) {
  const normalized = String(stage ?? "").trim().toLowerCase();
  if (normalized === "novos") return 0;
  if (normalized === "qualificacao") return 1;
  if (normalized === "proposta") return 2;
  if (normalized === "negociacao") return 3;
  if (normalized === "ganho" || normalized === "perdido") return 4;
  return 0;
}

function mapPriority(priority: string) {
  if (priority === "alta") return "Alta";
  if (priority === "baixa") return "Baixa";
  return "Média";
}

function toDateOnly(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toISOString().slice(0, 10);
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function initialsFromName(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "OC"
  );
}

export async function GET() {
  try {
    const [empresaId, profile, supabase] = await Promise.all([
      getEmpresaIdFromProfile(),
      getCurrentProfile(),
      createServerClient(),
    ]);

    const dealsRes = await supabase
      .from("crm_deals")
      .select(
        "id, nome, descricao, stage, status, priority, probability, valor, last_activity_at, next_activity_at, custom_fields, playbook_items, created_at, updated_at, company:crm_companies!crm_deals_company_id_fkey(nome), contact:crm_contacts!crm_deals_contact_id_fkey(nome), owner:profiles!crm_deals_owner_profile_id_fkey(nome)",
      )
      .eq("empresa_id", empresaId)
      .order("updated_at", { ascending: false })
      .limit(120);

    if (dealsRes.error) {
      throw new Error(`Erro ao carregar board do CRM: ${dealsRes.error.message}`);
    }

    const deals = (dealsRes.data ?? []) as Array<Record<string, unknown>>;
    const dealIds = deals.map((row) => String(row.id ?? "")).filter(Boolean);

    const activitiesRes = dealIds.length
      ? await supabase
          .from("crm_activities")
          .select("id, deal_id, type, subject, body, channel, due_at, done, created_at, updated_at")
          .eq("empresa_id", empresaId)
          .in("deal_id", dealIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };

    if (activitiesRes.error) {
      throw new Error(`Erro ao carregar atividades do CRM: ${activitiesRes.error.message}`);
    }

    const activityMap = new Map<string, Array<Record<string, unknown>>>();
    for (const activity of (activitiesRes.data ?? []) as Array<Record<string, unknown>>) {
      const dealId = String(activity.deal_id ?? "");
      const bucket = activityMap.get(dealId) ?? [];
      bucket.push(activity);
      activityMap.set(dealId, bucket);
    }

    const cards = deals.map((deal) => {
      const createdAt = String(deal.created_at ?? new Date().toISOString());
      const updatedAt = String(deal.updated_at ?? createdAt);
      const customFields =
        deal.custom_fields && typeof deal.custom_fields === "object" && !Array.isArray(deal.custom_fields)
          ? (deal.custom_fields as Record<string, string>)
          : {};
      const currentStepIndex = mapStageToStepIndex(String(deal.stage ?? "novos"));
      const stageDefaults = PIPELINE[currentStepIndex] ?? PIPELINE[0];
      const activities = activityMap.get(String(deal.id ?? "")) ?? [];
      const responsible =
        String((deal.owner as { nome?: string } | null)?.nome ?? "").trim() ||
        String(customFields.responsavel ?? "").trim() ||
        (profile?.nome ?? "Sem responsável");

      const playbookItems = Array.isArray(deal.playbook_items)
        ? (deal.playbook_items as Array<{ id?: string; label?: string; done?: boolean }>)
            .filter((item) => item && item.id && item.label)
            .map((item) => ({
              id: String(item.id),
              title: String(item.label),
              done: Boolean(item.done),
            }))
        : stageDefaults.subtasks.map((label, idx) => ({
            id: `default-${String(deal.id ?? "")}-${idx}`,
            title: label,
            done: false,
          }));

      return {
        id: String(deal.id ?? ""),
        title: String(deal.nome ?? "Negócio sem nome"),
        desc:
          String(deal.descricao ?? "").trim() ||
          [
            String((deal.company as { nome?: string } | null)?.nome ?? "").trim(),
            String((deal.contact as { nome?: string } | null)?.nome ?? "").trim(),
          ]
            .filter(Boolean)
            .join(" · ") ||
          "Sem descrição cadastrada.",
        responsible,
        priority: mapPriority(String(deal.priority ?? "media")),
        startDate: toDateOnly(customFields.start_date, createdAt.slice(0, 10)),
        date: toDateOnly(customFields.end_date ?? String(deal.next_activity_at ?? ""), updatedAt.slice(0, 10)),
        cost: Number(deal.valor ?? 0),
        isWorkflowCard: true,
        currentStepIndex,
        fvsSigned: false,
        subtasks: playbookItems,
        comments: activities.map((activity) => ({
          author: responsible,
          text: String(activity.body ?? activity.subject ?? "").trim() || "Atualização sem descrição.",
          date: formatTimestamp(String(activity.created_at ?? activity.updated_at ?? createdAt)),
        })),
        logs: [
          {
            text: `Negócio em ${stageDefaults.stageName} (${String(deal.status ?? "aberto")})`,
            date: formatTimestamp(updatedAt),
          },
          ...activities.map((activity) => ({
            text: String(activity.subject ?? "Atividade CRM"),
            date: formatTimestamp(String(activity.created_at ?? activity.updated_at ?? createdAt)),
          })),
        ],
        attachments: [],
      };
    });

    const userName = profile?.nome ?? "Usuário";
    const userRole = profile?.role ?? "Equipe";

    return NextResponse.json({
      ok: true,
      workflow: PIPELINE,
      sectors: SECTORS,
      cards,
      user: {
        name: userName,
        role: userRole,
        initials: initialsFromName(userName),
      },
      capabilities: {
        canEditStructure: false,
        canUploadAttachments: false,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar CRM focado";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
