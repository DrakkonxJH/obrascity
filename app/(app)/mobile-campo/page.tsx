import { PageHeader } from "@/components/ui/page-header";
import { listObras } from "@/lib/db/obras";
import { listMobileSyncConflicts, listMobileSyncJobs } from "@/lib/db/mobile-campo";
import {
  createMobileSyncConflictAction,
  createMobileSyncJobAction,
  resolveMobileSyncConflictAction,
} from "./actions";
import Link from "next/link";
import { getCurrentTenantFeatureAccess } from "@/lib/billing/server-feature-gate";
import { PremiumFeatureBlock } from "@/components/premium-feature-block";

function directionLabel(direction: string) {
  if (direction === "upload") return "Campo → nuvem";
  if (direction === "download") return "Nuvem → campo";
  if (direction === "bi_direcional") return "Bi-direcional";
  return direction;
}

function syncStatusLabel(status: string) {
  if (status === "processado") return "Processado";
  if (status === "pendente") return "Pendente";
  if (status === "em_analise") return "Em análise";
  return status;
}

function conflictStatusLabel(status: string) {
  if (status === "resolvido") return "Resolvido";
  if (status === "aberto") return "Aberto";
  if (status === "em_analise") return "Em análise";
  return status;
}

export default async function MobileCampoPage() {
  const { access } = await getCurrentTenantFeatureAccess("automacoes_workflow");
  if (access.level !== "allowed") {
    return <PremiumFeatureBlock featureName="Mobile Campo" status={access} />;
  }

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
  const openConflicts = conflicts.filter((conflict) => conflict.status !== "resolvido").length;
  const resolvedConflicts = conflicts.filter((conflict) => conflict.status === "resolvido").length;
  const totalPendencias = jobs.reduce(
    (acc, job) => acc + job.pendentes_criar + job.pendentes_atualizar + job.pendentes_deletar,
    0,
  );

  return (
    <section className="of-page">
        <PageHeader
          eyebrow="Sistema"
          title="Mobile campo"
          subtitle="Sincronização operacional, pendências e resolução de conflitos entre app e nuvem."
          actions={
            <>
              <Link href="/diario" className="of-btn-ghost">Abrir diário</Link>
              <Link href="/governanca" className="of-btn-primary">Ir para governança</Link>
            </>
          }
        />
        {warnings.length > 0 ? (
          <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
            <div className="of-card-title">Dados carregados parcialmente</div>
            <p className="of-empty-text">{warnings.join(" ")}</p>
          </article>
        ) : null}

        <article className="of-card" style={{ marginBottom: 20 }}>
          <div className="of-card-title">O que esta área faz</div>
          <p className="of-empty-text" style={{ marginBottom: 14 }}>
            O mobile campo serve para acompanhar o que foi coletado fora do escritório, o que
            ainda está pendente e onde surgiu diferença entre o dado local e o dado da nuvem.
          </p>
          <div className="of-stats-grid">
            <article className="of-stat-card">
              <div className="of-stat-value">{jobs.length}</div>
              <div className="of-stat-label">Lotes registrados</div>
            </article>
            <article className="of-stat-card">
              <div className="of-stat-value">{totalPendencias}</div>
              <div className="of-stat-label">Pendências totais</div>
            </article>
            <article className="of-stat-card">
              <div className="of-stat-value">{openConflicts}</div>
              <div className="of-stat-label">Conflitos abertos</div>
            </article>
            <article className="of-stat-card">
              <div className="of-stat-value">{resolvedConflicts}</div>
              <div className="of-stat-label">Conflitos resolvidos</div>
            </article>
          </div>
        </article>

        <div className="grid gap-4 lg:grid-cols-2">
          <form action={createMobileSyncJobAction} className="of-card of-form-grid">
            <div className="of-card-title">Registrar sincronização do campo</div>
            <p className="of-empty-text" style={{ marginBottom: 8 }}>
              Use este bloco quando o app de campo enviar dados para a nuvem ou quando houver
              retorno de atualização para o dispositivo.
            </p>
            <select name="obra_id" className="of-input" defaultValue="" required>
              <option value="" disabled>
                Selecione a obra
              </option>
              {obras.map((obra) => (
                <option key={obra.id} value={obra.id}>
                  {obra.nome}
                </option>
              ))}
            </select>
            <select name="direction" className="of-input" defaultValue="upload">
              <option value="upload">Campo → nuvem</option>
              <option value="download">Nuvem → campo</option>
              <option value="bi_direcional">Bi-direcional</option>
            </select>
            <div className="of-form-grid md:grid-cols-2">
              <input name="pendentes_criar" type="number" min={0} className="of-input" placeholder="Itens para criar" />
              <input
                name="pendentes_atualizar"
                type="number"
                min={0}
                className="of-input"
                placeholder="Itens para atualizar"
              />
              <input name="pendentes_deletar" type="number" min={0} className="of-input" placeholder="Itens para excluir" />
              <input name="conflitos" type="number" min={0} className="of-input" placeholder="Conflitos detectados" />
            </div>
            <button type="submit" className="of-btn-primary">
              Salvar lote de sync
            </button>
          </form>

          <form action={createMobileSyncConflictAction} className="of-card of-form-grid">
            <div className="of-card-title">Registrar conflito de sincronização</div>
            <p className="of-empty-text" style={{ marginBottom: 8 }}>
              Use este bloco quando um valor do campo divergir do que está salvo na nuvem.
            </p>
            <select name="sync_job_id" className="of-input" defaultValue="" required>
              <option value="" disabled>
                Selecione o lote
              </option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.obra_nome} · {directionLabel(job.direction)} ·{" "}
                  {new Date(job.created_at).toLocaleString("pt-BR")}
                </option>
              ))}
            </select>
            <input name="entidade" className="of-input" placeholder="Ex.: diário, tarefa, medição" required />
            <input name="campo" className="of-input" placeholder="Campo divergente" required />
            <input name="valor_local" className="of-input" placeholder="Valor do campo" />
            <input name="valor_remoto" className="of-input" placeholder="Valor salvo na nuvem" />
            <input name="resolucao" className="of-input" placeholder="Decisão inicial" />
            <button type="submit" className="of-btn-primary">
              Salvar conflito
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
                  <th>Status</th>
                  <th>Direção</th>
                  <th>Fila</th>
                  <th>Conflitos</th>
                  <th>Última sync</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.obra_nome}</td>
                    <td>{syncStatusLabel(job.status)}</td>
                    <td>{directionLabel(job.direction)}</td>
                    <td className="of-mono">
                      {job.pendentes_criar + job.pendentes_atualizar + job.pendentes_deletar}
                      <div className="of-list-description" style={{ marginTop: 4 }}>
                        Cria {job.pendentes_criar} · Atualiza {job.pendentes_atualizar} · Exclui{" "}
                        {job.pendentes_deletar}
                      </div>
                    </td>
                    <td className="of-mono">{job.conflitos}</td>
                    <td>{job.last_sync_at ? new Date(job.last_sync_at).toLocaleString("pt-BR") : "—"}</td>
                  </tr>
                ))}
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="of-empty-text">
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
                  <th>Resolução</th>
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
                    <td>{conflictStatusLabel(conflict.status)}</td>
                    <td>{conflict.resolucao || "—"}</td>
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
                    <td colSpan={7} className="of-empty-text">
                      Sem conflitos pendentes.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>
  );
}
