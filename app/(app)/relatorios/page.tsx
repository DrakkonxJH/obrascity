import Link from "next/link";
import { listObras } from "@/lib/db/obras";
import { listRelatorios } from "@/lib/db/relatorios";
import { solicitarRelatórioAction } from "./actions";
import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";

const reportCards = [
  {
    tipo: "progresso",
    icon: "📊",
    titulo: "Relatório de Progresso",
    desc: "Visão geral do andamento de todas as obras, com percentuais de conclusão, prazos e desvios.",
    foot: "Atualizado hoje",
    badge: "of-badge-green",
    badgeLabel: "PDF / Excel",
    href: "/relatorios/progresso",
  },
  {
    tipo: "financeiro",
    icon: "💰",
    titulo: "Relatório Financeiro",
    desc: "Análise de orçamento vs. realizado, fluxo de caixa, pagamentos e previsões por obra.",
    foot: `Dados: ${new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`,
    badge: "of-badge-blue",
    badgeLabel: "PDF / Excel",
    href: "/relatorios/financeiro",
  },
  {
    tipo: "equipes",
    icon: "👥",
    titulo: "Relatório de Equipes",
    desc: "Produtividade, horas trabalhadas, alocação e disponibilidade de todos os profissionais.",
    foot: "Semana atual",
    badge: "of-badge-purple",
    badgeLabel: "PDF",
    href: "/relatorios/equipes",
  },
  {
    tipo: "materiais",
    icon: "📦",
    titulo: "Relatório de Materiais",
    desc: "Inventário de estoque, consumo por obra, pedidos pendentes e alertas de ruptura.",
    foot: "Em tempo real",
    badge: "of-badge-yellow",
    badgeLabel: "PDF / Excel",
    href: "/relatorios/materiais",
  },
  {
    tipo: "diario",
    icon: "📝",
    titulo: "Diário de Obra",
    desc: "Registro diário de atividades, clima, equipes presentes e ocorrências de cada obra.",
    foot: "Por obra",
    badge: "of-badge-cyan",
    badgeLabel: "PDF",
    href: "/diario",
  },
  {
    tipo: "executivo",
    icon: "🎯",
    titulo: "Sumário Executivo",
    desc: "Visão consolidada para diretores: KPIs principais, riscos críticos e próximos marcos.",
    foot: "Mensal",
    badge: "of-badge-green",
    badgeLabel: "PDF",
    href: "/relatorios/executivo",
  },
];

export default async function RelatóriosPage() {
  let relatórios: Awaited<ReturnType<typeof listRelatorios>> = [];
  let obras: Awaited<ReturnType<typeof listObras>> = [];
  let loadError: string | null = null;

  try {
    [relatórios, obras] = await Promise.all([listRelatorios(), listObras()]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Erro ao carregar relatórios.";
  }

  return (
    <FeatureGateWrapper feature="relatórios_basic">
      <section className="of-page">
      {loadError ? (
        <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-red)" }}>
          <p className="of-card-title">Falha ao carregar dados de relatórios</p>
          <p className="of-empty-text">{loadError}</p>
        </article>
      ) : null}
      <p className="of-empty-text" style={{ marginBottom: 20 }}>
        Gere e exporte relatórios gerenciais das suas obras
      </p>

      <div className="of-rel-grid">
        {reportCards.map((card) => (
          <Link key={card.tipo} href={card.href} target="_blank" rel="noreferrer" className="of-rel-card">
            <p className="of-rel-icon">{card.icon}</p>
            <p className="of-rel-title">{card.titulo}</p>
            <p className="of-rel-desc">{card.desc}</p>
            <div className="of-rel-foot">
              <span>{card.foot}</span>
              <span className={`of-badge ${card.badge}`}>{card.badgeLabel}</span>
            </div>
          </Link>
        ))}
      </div>

      <form action={solicitarRelatórioAction} className="of-card of-form-grid md:grid-cols-4" style={{ marginTop: 20 }}>
        <div className="of-card-title md:col-span-4">Solicitação personalizada</div>
        <select name="tipo" defaultValue="progresso" className="of-input">
          <option value="progresso">Progresso</option>
          <option value="financeiro">Financeiro</option>
          <option value="equipes">Equipes</option>
          <option value="materiais">Materiais</option>
          <option value="diario">Diário de obra</option>
          <option value="executivo">Executivo</option>
        </select>
        <select name="formato" defaultValue="pdf" className="of-input">
          <option value="pdf">PDF</option>
          <option value="excel">Excel</option>
        </select>
        <select name="obra_id" defaultValue="" className="of-input">
          <option value="">Todas as obras</option>
          {obras.map((obra) => (
            <option key={obra.id} value={obra.id}>
              {obra.nome}
            </option>
          ))}
        </select>
        <div className="md:col-span-2">
          <button type="submit" className="of-btn-primary">
            Solicitar relatório
          </button>
        </div>
      </form>

      <div className="of-table-wrap" style={{ marginTop: 20 }}>
        <table className="of-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Escopo</th>
              <th>Status</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            {relatórios.map((rel) => (
              <tr key={rel.id}>
                <td>{rel.tipo}</td>
                <td>{rel.obra_nome ?? "Todas"}</td>
                <td>
                  <span className="of-badge of-badge-blue">{rel.status}</span>
                </td>
                <td className="of-mono">{rel.url ?? "—"}</td>
              </tr>
            ))}
            {relatórios.length === 0 ? (
              <tr>
                <td colSpan={4} className="of-empty-text">
                  Nenhum relatório solicitado ainda.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      </section>
    </FeatureGateWrapper>
  );
}
