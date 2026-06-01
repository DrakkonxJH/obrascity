import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { PageHeader } from "@/components/ui/page-header";
import { listObras } from "@/lib/db/obras";
import { listMudancas } from "@/lib/db/mudancas";
import { createMudancaAction } from "./actions";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const tipoLabels: Record<string, string> = {
  escopo: "Escopo",
  prazo: "Prazo",
  custo: "Custo",
  contratual: "Contratual",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

const statusBadgeClass: Record<string, string> = {
  pendente: "of-badge-warning",
  aprovado: "of-badge-success",
  rejeitado: "of-badge-error",
};

export default async function MudancasPage() {
  const [obrasResult, mudancasResult] = await Promise.allSettled([listObras(), listMudancas()]);
  const warnings: string[] = [];
  const obras =
    obrasResult.status === "fulfilled"
      ? obrasResult.value
      : (warnings.push("Falha ao carregar obras para mudanças."), []);
  const mudancas =
    mudancasResult.status === "fulfilled"
      ? mudancasResult.value
      : (warnings.push("Falha ao carregar mudanças registradas (verifique migrations)."), []);

  const totalMudancas = mudancas.length;
  const pendentesAprovacao = mudancas.filter((item) => item.status === "pendente").length;
  const impactoTotalPrazo = mudancas.reduce((acc, item) => acc + item.impacto_prazo_dias, 0);
  const impactoTotalCusto = mudancas.reduce((acc, item) => acc + item.impacto_custo, 0);
  const distribuicaoPorTipo = ["escopo", "prazo", "custo", "contratual"].map((tipo) => ({
    tipo,
    total: mudancas.filter((item) => item.tipo === tipo).length,
  }));

  return (
    <FeatureGateWrapper feature="automacoes_workflow">
      <section className="of-page">
        <PageHeader
          eyebrow="Governança de escopo"
          title="Mudanças"
          subtitle="Controle solicitações de escopo, prazo, custo e cláusulas contratuais com rastreabilidade operacional."
        />

        {warnings.length > 0 ? (
          <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
            <div className="of-card-title">Dados carregados parcialmente</div>
            <p className="of-empty-text">{warnings.join(" ")}</p>
          </article>
        ) : null}

        <div className="of-stats-grid" style={{ marginBottom: 20 }}>
          <article className="of-stat-card">
            <div className="of-stat-value">{totalMudancas}</div>
            <div className="of-stat-label">Total de mudanças</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{pendentesAprovacao}</div>
            <div className="of-stat-label">Pendentes de aprovação</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{impactoTotalPrazo}</div>
            <div className="of-stat-label">Impacto total de prazo (dias)</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{money.format(impactoTotalCusto)}</div>
            <div className="of-stat-label">Impacto total de custo</div>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <form action={createMudancaAction} className="of-card of-form-grid md:grid-cols-3">
            <div className="of-card-title md:col-span-3">Nova solicitação de mudança</div>
            <select name="obra_id" className="of-input" defaultValue="" required>
              <option value="" disabled>
                Obra
              </option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome}
                </option>
              ))}
            </select>
            <select name="tipo" className="of-input" defaultValue="escopo">
              <option value="escopo">Escopo</option>
              <option value="prazo">Prazo</option>
              <option value="custo">Custo</option>
              <option value="contratual">Contratual</option>
            </select>
            <input name="titulo" className="of-input" placeholder="Título da mudança" required />
            <input name="descricao" className="of-input md:col-span-3" placeholder="Descrição detalhada" required />
            <input name="impacto_prazo_dias" type="number" min={0} className="of-input" placeholder="Impacto de prazo (dias)" />
            <input name="impacto_custo" type="number" min={0} step="0.01" className="of-input" placeholder="Impacto de custo" />
            <button type="submit" className="of-btn-primary">
              Abrir solicitação
            </button>
          </form>

          <article className="of-card">
            <div className="of-card-title">Distribuição por tipo</div>
            <div className="of-stats-grid" style={{ marginTop: 12 }}>
              {distribuicaoPorTipo.map((item) => (
                <article key={item.tipo} className="of-stat-card">
                  <div className="of-stat-value">{item.total}</div>
                  <div className="of-stat-label">{tipoLabels[item.tipo] ?? item.tipo}</div>
                </article>
              ))}
            </div>
            <p className="of-empty-text" style={{ marginTop: 12 }}>
              Priorize aprovações pendentes para evitar impacto acumulado de prazo e custo.
            </p>
          </article>
        </div>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Solicitações registradas</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Prazo</th>
                  <th>Custo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mudancas.map((item) => (
                  <tr key={item.id}>
                    <td>{item.obra_nome}</td>
                    <td>
                      <span className="of-badge of-badge-default">{tipoLabels[item.tipo] ?? item.tipo}</span>
                    </td>
                    <td>{item.titulo}</td>
                    <td className="of-mono">{item.impacto_prazo_dias} dias</td>
                    <td>{money.format(item.impacto_custo)}</td>
                    <td>
                      <span className={`of-badge ${statusBadgeClass[item.status] ?? "of-badge-default"}`}>
                        {statusLabels[item.status] ?? item.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {mudancas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="of-empty-text">
                      Nenhuma solicitação de mudança registrada.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </FeatureGateWrapper>
  );
}
