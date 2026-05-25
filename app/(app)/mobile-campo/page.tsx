import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { listObras } from "@/lib/db/obras";
import { listMobileSyncConflicts, listMobileSyncJobs } from "@/lib/db/mobile-campo";
import {
  createMobileSyncConflictAction,
  createMobileSyncJobAction,
  resolveMobileSyncConflictAction,
} from "./actions";

export default async function MobileCampoPage() {
  const [obrasResult, jobsResult, conflictsResult] = await Promise.allSettled([
    listObras(),
    listMobileSyncJobs(),
    listMobileSyncConflicts(),
  ]);
  const warnings: string[] = [];
  const obras =
    obrasResult.status === "fulfilled"
      ? obrasResult.value
      : (warnings.push("Falha ao carregar obras para mobile campo."), []);
  const jobs =
    jobsResult.status === "fulfilled"
      ? jobsResult.value
      : (warnings.push("Falha ao carregar lotes de sincronização (verifique migrations)."), []);
  const conflicts =
    conflictsResult.status === "fulfilled"
      ? conflictsResult.value
      : (warnings.push("Falha ao carregar conflitos de sincronização."), []);

  return (
    <FeatureGateWrapper feature="automacoes_workflow">
      <section className="of-page">
        {warnings.length > 0 ? (
          <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
            <div className="of-card-title">Dados carregados parcialmente</div>
            <p className="of-empty-text">{warnings.join(" ")}</p>
          </article>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          <form action={createMobileSyncJobAction} className="of-card of-form-grid">
            <div className="of-card-title">Sincronização offline de campo</div>
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
            <select name="direction" className="of-input" defaultValue="upload">
              <option value="upload">Upload do campo para nuvem</option>
              <option value="download">Download da nuvem para campo</option>
              <option value="bi_direcional">Bi-direcional</option>
            </select>
            <div className="of-form-grid md:grid-cols-2">
              <input name="pendentes_criar" type="number" min={0} className="of-input" placeholder="Pendentes criar" />
              <input name="pendentes_atualizar" type="number" min={0} className="of-input" placeholder="Pendentes atualizar" />
              <input name="pendentes_deletar" type="number" min={0} className="of-input" placeholder="Pendentes deletar" />
              <input name="conflitos" type="number" min={0} className="of-input" placeholder="Conflitos" />
            </div>
            <button type="submit" className="of-btn-primary">
              Registrar sync
            </button>
          </form>

          <form action={createMobileSyncConflictAction} className="of-card of-form-grid">
            <div className="of-card-title">Conflitos de sincronização</div>
            <select name="sync_job_id" className="of-input" defaultValue="" required>
              <option value="" disabled>
                Lote de sincronização
              </option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.obra_nome} · {new Date(job.created_at).toLocaleString("pt-BR")}
                </option>
              ))}
            </select>
            <input name="entidade" className="of-input" placeholder="Entidade (diário, tarefa, medição...)" required />
            <input name="campo" className="of-input" placeholder="Campo em conflito" required />
            <input name="valor_local" className="of-input" placeholder="Valor local" />
            <input name="valor_remoto" className="of-input" placeholder="Valor remoto" />
            <input name="resolucao" className="of-input" placeholder="Resolução inicial" />
            <button type="submit" className="of-btn-primary">
              Registrar conflito
            </button>
          </form>
        </div>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Lotes de sincronização</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Direção</th>
                  <th>Pendências</th>
                  <th>Conflitos</th>
                  <th>Última sync</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.obra_nome}</td>
                    <td>{job.direction}</td>
                    <td className="of-mono">
                      {job.pendentes_criar + job.pendentes_atualizar + job.pendentes_deletar}
                    </td>
                    <td className="of-mono">{job.conflitos}</td>
                    <td>{job.last_sync_at ? new Date(job.last_sync_at).toLocaleString("pt-BR") : "—"}</td>
                  </tr>
                ))}
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="of-empty-text">
                      Sem sincronizações registradas.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Fila de conflitos</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Entidade</th>
                  <th>Campo</th>
                  <th>Local</th>
                  <th>Remoto</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map((conflict) => (
                  <tr key={conflict.id}>
                    <td>{conflict.entidade}</td>
                    <td>{conflict.campo}</td>
                    <td>{conflict.valor_local || "—"}</td>
                    <td>{conflict.valor_remoto || "—"}</td>
                    <td>{conflict.status}</td>
                    <td>
                      {conflict.status === "resolvido" ? null : (
                        <form action={resolveMobileSyncConflictAction} style={{ display: "flex", gap: 8 }}>
                          <input type="hidden" name="conflict_id" value={conflict.id} />
                          <input name="resolucao" className="of-input" placeholder="Decisão final" required />
                          <button type="submit" className="of-btn-ghost">
                            Resolver
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
                {conflicts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="of-empty-text">
                      Sem conflitos pendentes.
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
