"use client";

import Link from "next/link";
import type { Obra } from "@/types/domain";
import { PageHeader } from "@/components/ui/page-header";
import {
  AlertTriangle,
  BellDot,
  Briefcase,
  CheckCircle2,
  HardHat,
  Hourglass,
  TrendingUp,
  Users,
} from "lucide-react";

const statusVisual: Record<string, { color: string; label: string; meta: string }> = {
  planejamento: { color: "var(--of-blue)", label: "Planejamento", meta: "Em preparação" },
  andamento: { color: "var(--of-green)", label: "Em andamento", meta: "No prazo" },
  atencao: { color: "var(--of-yellow)", label: "Atenção", meta: "Atraso identificado" },
  concluida: { color: "var(--of-purple)", label: "Concluída", meta: "Entrega finalizada" },
};

const activityColors = ["var(--of-green)", "var(--of-yellow)", "var(--of-blue)", "var(--of-purple)", "var(--of-green)"];

const activityTimes = ["há 2 horas", "há 4 horas", "ontem, 15:30", "ontem, 10:15", "2 dias atrás"];

type DashboardViewProps = {
  resumo: { total: number; andamento: number; concluidas: number };
  membrosCount: number;
  obras: Obra[];
  totalOrcado: number;
  totalRealizado: number;
  mediaProgresso: number;
};

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function DashboardView({
  resumo,
  membrosCount,
  obras,
  totalOrcado,
  totalRealizado,
  mediaProgresso,
}: DashboardViewProps) {
  const obrasOrdenadas = [...obras].sort((a, b) => b.progresso - a.progresso);
  const consumoPct = totalOrcado > 0 ? Math.round((totalRealizado / totalOrcado) * 100) : 0;
  const isContaNova = obras.length === 0 && membrosCount === 0 && totalOrcado === 0 && totalRealizado === 0;

  const alertas = isContaNova
    ? [
        {
          titulo: "Vamos começar seu ambiente",
          descricao: "Adicione sua primeira obra, equipe e materiais para liberar alertas operacionais reais.",
          tipo: "info" as const,
          icon: BellDot,
          href: "/obras",
        },
      ]
    : [
        ...obras
          .filter((o) => o.status === "atencao")
          .slice(0, 2)
          .map((obra) => ({
            titulo: `${obra.nome} com atraso`,
            descricao: `Cliente ${obra.cliente} · progresso ${obra.progresso}%.`,
            tipo: "danger" as const,
            icon: AlertTriangle,
            href: "/obras",
          })),
        {
          titulo: "Estoque crítico de materiais",
          descricao: "Revise níveis mínimos e pedidos pendentes.",
          tipo: "warn" as const,
          icon: AlertTriangle,
          href: "/materiais",
        },
        {
          titulo: "Orçamento em monitoramento",
          descricao: `${consumoPct}% do orçamento total consumido.`,
          tipo: consumoPct >= 85 ? "warn" : "info",
          icon: TrendingUp,
          href: "/financeiro",
        },
        {
          titulo: "Relatório semanal pendente",
          descricao: "Gere o relatório consolidado das equipes.",
          tipo: "info" as const,
          icon: Briefcase,
          href: "/equipes",
        },
      ].slice(0, 4);

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Operacao"
        title="Resumo executivo da operacao"
        subtitle="Acompanhe obras, progresso, alertas e consumo de orcamento em tempo real."
        actions={
          <>
            <Link href="/obras" className="of-btn-ghost">Ver obras</Link>
            <Link href="/cronograma" className="of-btn-primary">Abrir cronograma</Link>
          </>
        }
      />
      <div className="of-kpi-grid">
        <article className="of-metric-card blue">
          <p className="of-kpi-icon"><HardHat size={18} aria-hidden /></p>
          <p className="of-kpi-label">Obras Ativas</p>
          <p className="of-kpi-value" style={{ color: "var(--of-blue)" }}>
            {resumo.total}
          </p>
          <p className="of-metric-change up">
            {isContaNova ? "Adicione sua primeira obra" : "↑ visão consolidada"}
          </p>
        </article>
        <article className="of-metric-card yellow">
          <p className="of-kpi-icon"><Hourglass size={18} aria-hidden /></p>
          <p className="of-kpi-label">Em Andamento</p>
          <p className="of-kpi-value" style={{ color: "var(--of-yellow)" }}>
            {resumo.andamento}
          </p>
          <p className="of-metric-change">
            {isContaNova ? "Sem execução iniciada" : `${resumo.andamento} no prazo`}
          </p>
        </article>
        <article className="of-metric-card green">
          <p className="of-kpi-icon"><Users size={18} aria-hidden /></p>
          <p className="of-kpi-label">Profissionais</p>
          <p className="of-kpi-value" style={{ color: "var(--of-green)" }}>
            {membrosCount}
          </p>
          <p className="of-metric-change up">
            {isContaNova ? "Convide o primeiro membro" : "↑ ativos"}
          </p>
        </article>
        <article className="of-metric-card purple">
          <p className="of-kpi-icon"><CheckCircle2 size={18} aria-hidden /></p>
          <p className="of-kpi-label">Concluídas</p>
          <p className="of-kpi-value" style={{ color: "var(--of-purple)" }}>
            {resumo.concluidas}
          </p>
          <p className="of-metric-change up">
            {isContaNova ? "Acompanhe entregas por ciclo" : "↑ este ciclo"}
          </p>
        </article>
      </div>

      <div className="of-dashboard-grid">
        <article className="of-card">
          <div className="of-card-title">
            Progresso das Obras <span>atualizado agora</span>
          </div>
          {obrasOrdenadas.slice(0, 5).map((obra) => {
            const visual = statusVisual[obra.status] ?? statusVisual.planejamento;
            return (
              <div key={obra.id} className="of-progress-item">
                <div className="of-progress-header">
                  <span className="of-progress-name">{obra.nome}</span>
                  <span className="of-progress-pct of-mono">{obra.progresso}%</span>
                </div>
                <div className="of-progress-bar">
                  <div
                    className="of-progress-fill"
                    style={{ width: `${obra.progresso}%`, background: visual.color }}
                  />
                </div>
                <p className="of-progress-meta">
                  Cliente: {obra.cliente} · <span style={{ color: visual.color }}>{visual.meta}</span>
                </p>
              </div>
            );
          })}
          {obrasOrdenadas.length === 0 ? (
            <p className="of-empty-text">
              Nenhuma obra ativa ainda. Cadastre uma obra para liberar o monitoramento executivo.
            </p>
          ) : null}
        </article>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <article className="of-card">
            <div className="of-card-title">Alertas Ativos</div>
            <div className="of-alert-list">
              {alertas.map((alerta) => {
                const AlertIcon = alerta.icon;
                return (
                  <Link key={alerta.titulo} href={alerta.href} className={`of-alert-item ${alerta.tipo}`}>
                    <p className="of-alert-title">
                      <span className="of-alert-icon"><AlertIcon size={14} aria-hidden /></span>
                      {alerta.titulo}
                    </p>
                    <p className="of-alert-description">{alerta.descricao}</p>
                  </Link>
                );
              })}
            </div>
          </article>

          <article className="of-card">
            <div className="of-card-title">Atividade Recente</div>
            <ul className="of-activity-list">
              {obras.length > 0 ? (
                obras.slice(0, 5).map((obra, index) => (
                  <li key={obra.id} className="of-activity-item">
                    <span className="of-activity-dot" style={{ background: activityColors[index % activityColors.length] }} />
                    <div>
                      <p className="of-activity-title">{obra.nome}</p>
                      <p className="of-activity-description of-mono">
                        {statusVisual[obra.status]?.label ?? "Status"} · {activityTimes[index] ?? "atualizado hoje"}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <li className="of-activity-item">
                  <span className="of-activity-dot" style={{ background: "var(--of-blue)" }} />
                  <div>
                    <p className="of-activity-title">Sem atividade registrada ainda</p>
                    <p className="of-activity-description of-mono">Cadastre sua primeira obra para iniciar o histórico.</p>
                  </div>
                </li>
              )}
            </ul>
          </article>
        </div>
      </div>

      <div className="of-dash-grid-3">
        <article className="of-card of-mini-kpi-card">
          <div className="of-card-title">Orçamento Total</div>
          <p className="of-mini-value">{money.format(totalOrcado)}</p>
          <p className="of-mini-sub">
            {isContaNova ? "Defina orçamento ao cadastrar a primeira obra" : `${obras.length} obras ativas`}
          </p>
          <svg className="of-mini-chart" viewBox="0 0 200 60" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradOrcamento" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--of-blue)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            <polyline
              points="0,50 25,40 50,42 75,28 100,30 125,18 150,20 175,12 200,8"
              fill="none"
              stroke="var(--of-blue)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <polygon
              points="0,50 25,40 50,42 75,28 100,30 125,18 150,20 175,12 200,8 200,60 0,60"
              fill="url(#gradOrcamento)"
              opacity="0.2"
            />
          </svg>
        </article>
        <article className="of-card of-mini-kpi-card">
          <div className="of-card-title">Gasto Acumulado</div>
          <p className="of-mini-value" style={{ color: "var(--of-yellow)" }}>
            {money.format(totalRealizado)}
          </p>
          <p className="of-mini-sub">
            {isContaNova ? "Sem despesas registradas ainda" : `${consumoPct}% do orçamento total`}
          </p>
          <div className="of-progress-bar" style={{ marginTop: 14 }}>
            <div className="of-progress-fill" style={{ width: `${consumoPct}%`, background: "var(--of-yellow)" }} />
          </div>
        </article>
        <article className="of-card of-mini-kpi-card">
          <div className="of-card-title">Média de Progresso</div>
          <p className="of-mini-value" style={{ color: "var(--of-green)" }}>
            {mediaProgresso}%
          </p>
          <p className="of-mini-sub">
            {isContaNova ? "Progresso aparece após criar tarefas e medições" : "obras em execução"}
          </p>
          <svg className="of-mini-chart" viewBox="0 0 200 60" preserveAspectRatio="none">
            <polyline
              points="0,55 25,48 50,44 75,36 100,32 125,25 150,22 175,18 200,15"
              fill="none"
              stroke="var(--of-green)"
              strokeWidth="2"
            />
          </svg>
        </article>
      </div>
    </section>
  );
}
