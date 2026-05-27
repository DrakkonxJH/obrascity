import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { listObras } from "@/lib/db/obras";
import { listViabilidade } from "@/lib/db/viabilidade";
import { saveViabilidadeAction } from "./actions";

type StatusField = "status_tecnico" | "status_legal" | "status_economico";

export default async function ViabilidadePage() {
  const [obrasResult, estudosResult] = await Promise.allSettled([
    listObras(),
    listViabilidade(),
  ]);
  const warnings: string[] = [];
  const obras =
    obrasResult.status === "fulfilled"
      ? obrasResult.value
      : (warnings.push("Falha ao carregar obras para viabilidade."), []);
  const estudos =
    estudosResult.status === "fulfilled"
      ? estudosResult.value
      : (warnings.push("Falha ao carregar estudos de viabilidade."), []);
  const obraNomeById = new Map(obras.map((obra) => [obra.id, obra.nome]));
  const estudosComObraNome = estudos.map((item) => ({
    ...item,
    obra_nome: obraNomeById.get(item.obra_id) ?? "Obra",
  }));

  const totalEstudos = estudosComObraNome.length;
  const goAprovados = estudosComObraNome.filter((item) => item.go_no_go === "go").length;
  const noGos = estudosComObraNome.filter((item) => item.go_no_go === "no_go").length;
  const pendentes = estudosComObraNome.filter((item) => item.go_no_go === "pendente").length;

  const getResumoStatus = (field: StatusField) => ({
    aprovados: estudosComObraNome.filter((item) => item[field] === "ok").length,
    restricoes: estudosComObraNome.filter((item) => item[field] === "restricao").length,
    pendentes: estudosComObraNome.filter((item) => item[field] === "pendente").length,
  });

  const resumoTecnico = getResumoStatus("status_tecnico");
  const resumoLegal = getResumoStatus("status_legal");
  const resumoEconomico = getResumoStatus("status_economico");

  return (
    <FeatureGateWrapper feature="obras_basic">
      <section className="of-page">
        {warnings.length > 0 ? (
          <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
            <div className="of-card-title">Dados carregados parcialmente</div>
            <p className="of-empty-text">{warnings.join(" ")}</p>
          </article>
        ) : null}

        <div className="of-stats-grid" style={{ marginBottom: 20 }}>
          <article className="of-stat-card">
            <div className="of-stat-value">{totalEstudos}</div>
            <div className="of-stat-label">Total de estudos</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{goAprovados}</div>
            <div className="of-stat-label">GO aprovados</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{noGos}</div>
            <div className="of-stat-label">NO-GO</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{pendentes}</div>
            <div className="of-stat-label">Pendentes</div>
          </article>
        </div>

        <form action={saveViabilidadeAction} className="of-card of-form-grid md:grid-cols-3">
          <div className="of-card-title md:col-span-3">Viabilidade técnica, legal e econômica</div>
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
          <select name="status_tecnico" className="of-input" defaultValue="pendente">
            <option value="pendente">Técnico pendente</option>
            <option value="ok">Técnico aprovado</option>
            <option value="restricao">Técnico com restrição</option>
          </select>
          <select name="status_legal" className="of-input" defaultValue="pendente">
            <option value="pendente">Legal pendente</option>
            <option value="ok">Legal aprovado</option>
            <option value="restricao">Legal com restrição</option>
          </select>
          <select name="status_economico" className="of-input" defaultValue="pendente">
            <option value="pendente">Econômico pendente</option>
            <option value="ok">Econômico aprovado</option>
            <option value="restricao">Econômico com restrição</option>
          </select>
          <select name="go_no_go" className="of-input" defaultValue="pendente">
            <option value="pendente">Go/No-Go pendente</option>
            <option value="go">GO</option>
            <option value="no_go">NO-GO</option>
          </select>
          <input name="parecer" className="of-input md:col-span-3" placeholder="Parecer consolidado" />
          <button type="submit" className="of-btn-primary md:col-span-3">
            Salvar análise
          </button>
        </form>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Estudos por obra</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Técnico</th>
                  <th>Legal</th>
                  <th>Econômico</th>
                  <th>Go/No-Go</th>
                  <th>Parecer</th>
                </tr>
              </thead>
              <tbody>
                {estudosComObraNome.map((item) => (
                  <tr key={item.id}>
                    <td>{item.obra_nome}</td>
                    <td>{item.status_tecnico}</td>
                    <td>{item.status_legal}</td>
                    <td>{item.status_economico}</td>
                    <td>{item.go_no_go}</td>
                    <td>{item.parecer || "—"}</td>
                  </tr>
                ))}
                {estudosComObraNome.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="of-empty-text">
                      Nenhum estudo cadastrado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Resumo por status</div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="of-list-title">Técnico</p>
              <p className="of-list-description">
                {resumoTecnico.aprovados} aprovados, {resumoTecnico.restricoes} com restrição, {resumoTecnico.pendentes} pendentes
              </p>
            </div>
            <div>
              <p className="of-list-title">Legal</p>
              <p className="of-list-description">
                {resumoLegal.aprovados} aprovados, {resumoLegal.restricoes} com restrição, {resumoLegal.pendentes} pendentes
              </p>
            </div>
            <div>
              <p className="of-list-title">Econômico</p>
              <p className="of-list-description">
                {resumoEconomico.aprovados} aprovados, {resumoEconomico.restricoes} com restrição, {resumoEconomico.pendentes} pendentes
              </p>
            </div>
          </div>
        </article>
      </section>
    </FeatureGateWrapper>
  );
}
