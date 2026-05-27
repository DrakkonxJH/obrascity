import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { listObras } from "@/lib/db/obras";
import { listProjetosConflitos, listProjetosDocumentos } from "@/lib/db/projetos";
import { createProjetoConflitoAction, createProjetoDocumentoAction } from "./actions";

export default async function ProjetosPage() {
  const [obrasResult, documentosResult, conflitosResult] = await Promise.allSettled([
    listObras(),
    listProjetosDocumentos(),
    listProjetosConflitos(),
  ]);
  const warnings: string[] = [];
  const obras =
    obrasResult.status === "fulfilled"
      ? obrasResult.value
      : (warnings.push("Falha ao carregar obras para projetos."), []);
  const documentos =
    documentosResult.status === "fulfilled"
      ? documentosResult.value
      : (warnings.push("Falha ao carregar documentos de projeto."), []);
  const conflitos =
    conflitosResult.status === "fulfilled"
      ? conflitosResult.value
      : (warnings.push("Falha ao carregar conflitos de projeto (verifique migrations)."), []);

  const documentosCompatibilizados = documentos.filter((item) => item.status === "compatibilizado").length;
  const conflitosAbertos = conflitos.filter((item) => item.status === "aberto").length;
  const conflitosCriticos = conflitos.filter((item) => item.severidade === "critica").length;

  return (
    <FeatureGateWrapper feature="gestão_documentos">
      <section className="of-page">
        {warnings.length > 0 ? (
          <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
            <div className="of-card-title">Dados carregados parcialmente</div>
            <p className="of-empty-text">{warnings.join(" ")}</p>
          </article>
        ) : null}

        <div className="of-stats-grid" style={{ marginBottom: 20 }}>
          <article className="of-stat-card">
            <div className="of-stat-value">{documentos.length}</div>
            <div className="of-stat-label">Total de documentos</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{documentosCompatibilizados}</div>
            <div className="of-stat-label">Compatibilizados</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{conflitosAbertos}</div>
            <div className="of-stat-label">Conflitos abertos</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{conflitosCriticos}</div>
            <div className="of-stat-label">Conflitos críticos</div>
          </article>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <form action={createProjetoDocumentoAction} className="of-card of-form-grid">
            <div className="of-card-title">Compatibilização de projetos</div>
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
            <input name="disciplina" className="of-input" placeholder="Disciplina (estrutura, elétrica...)" required />
            <input name="revisao" className="of-input" placeholder="Revisão (R00, R01...)" required />
            <select name="status" className="of-input" defaultValue="em_revisao">
              <option value="em_revisao">Em revisão</option>
              <option value="compatibilizado">Compatibilizado</option>
              <option value="aprovado">Aprovado</option>
            </select>
            <input name="observacoes" className="of-input" placeholder="Observações" />
            <button type="submit" className="of-btn-primary">
              Salvar documento
            </button>
          </form>

          <form action={createProjetoConflitoAction} className="of-card of-form-grid">
            <div className="of-card-title">Conflitos de projeto (clash / interfaces)</div>
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
            <input name="titulo" className="of-input" placeholder="Título do conflito" required />
            <input name="descricao" className="of-input" placeholder="Descrição" required />
            <select name="severidade" className="of-input" defaultValue="media">
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
            <input name="prazo" type="date" className="of-input" />
            <button type="submit" className="of-btn-primary">
              Registrar conflito
            </button>
          </form>
        </div>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Documentos de projeto</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Disciplina</th>
                  <th>Revisão</th>
                  <th>Status</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((item) => (
                  <tr key={item.id}>
                    <td>{item.obra_nome}</td>
                    <td>{item.disciplina}</td>
                    <td>{item.revisao}</td>
                    <td>{item.status}</td>
                    <td>{item.observacoes || "—"}</td>
                  </tr>
                ))}
                {documentos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="of-empty-text">
                      Sem documentos cadastrados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Conflitos abertos</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Título</th>
                  <th>Severidade</th>
                  <th>Status</th>
                  <th>Prazo</th>
                </tr>
              </thead>
              <tbody>
                {conflitos.map((item) => (
                  <tr key={item.id}>
                    <td>{item.obra_nome}</td>
                    <td>{item.titulo}</td>
                    <td>{item.severidade}</td>
                    <td>{item.status}</td>
                    <td>{item.prazo || "—"}</td>
                  </tr>
                ))}
                {conflitos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="of-empty-text">
                      Sem conflitos cadastrados.
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
