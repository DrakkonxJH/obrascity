import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/require-profile";
import { listObras } from "@/lib/db/obras";
import type { ObraStatus } from "@/types/domain";

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

function mapObraStatusToStepIndex(status: ObraStatus | string) {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "planejamento") return 0;
  if (normalized === "andamento") return 2;
  if (normalized === "atencao") return 3;
  if (normalized === "concluida") return 4;
  return 0;
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
    const [profile, obras] = await Promise.all([getCurrentProfile(), listObras()]);

    const cards = obras.map((obra) => {
      const createdAt = obra.created_at ?? new Date().toISOString();
      const currentStepIndex = mapObraStatusToStepIndex(obra.status);
      const stageDefaults = PIPELINE[currentStepIndex] ?? PIPELINE[0];
      const progressPercent = Math.max(0, Math.min(100, Number(obra.progresso ?? 0)));
      const totalSubtasks = stageDefaults.subtasks.length || 1;
      const doneCount =
        progressPercent >= 100
          ? totalSubtasks
          : Math.max(0, Math.min(totalSubtasks - 1, Math.floor((progressPercent / 100) * totalSubtasks)));

      return {
        id: obra.id,
        title: obra.nome,
        desc: [obra.cliente, `Status: ${obra.status}`].filter(Boolean).join(" · ") || "Obra sem descrição complementar.",
        responsible: profile?.nome ?? "Sem responsável",
        priority: obra.status === "atencao" ? "Alta" : obra.status === "concluida" ? "Baixa" : "Média",
        startDate: toDateOnly(createdAt, new Date().toISOString().slice(0, 10)),
        date: toDateOnly(createdAt, new Date().toISOString().slice(0, 10)),
        cost: 0,
        isWorkflowCard: true,
        currentStepIndex,
        fvsSigned: false,
        subtasks: stageDefaults.subtasks.map((title, idx) => ({
          id: `obra-${obra.id}-sub-${idx}`,
          title,
          done: idx < doneCount,
        })),
        comments: [],
        logs: [
          {
            text: `Obra sincronizada da empresa com status ${obra.status}`,
            date: formatTimestamp(createdAt),
          },
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
