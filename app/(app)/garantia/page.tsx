import { PageHeader } from "@/components/molecules/page-header";
import { listObras } from "@/lib/db/obras";
import { escalateGarantiaSlaBreaches, listGarantiaChamados, listGarantiaInteracoes } from "@/lib/db/garantia";
import {
  createGarantiaChamadoAction,
  createGarantiaInteracaoAction,
  updateGarantiaStatusAction,
} from "./actions";
import Link from "next/link";
import { getCurrentTenantFeatureAccess } from "@/lib/billing/server-feature-gate";
import { PremiumFeatureBlock } from "@/components/organisms/premium-feature-block";

export default async function GarantiaPage() {
  const { access } = await getCurrentTenantFeatureAccess("qualidade_basic");
  if (access.level !== "allowed") {
    return <PremiumFeatureBlock featureName="Garantia" status={access} />;
  }

  const [obrasResult, chamadosResult, escalonamentoResult] = await Promise.allSettled([
    listObras(),
    listGarantiaChamados(),
    escalateGarantiaSlaBreaches(),
  ]);
  const warnings: string[] = [];
  const obras =
    obrasResult.status === "fulfilled"
      ? obrasResult.value
      : (warnings.push("Falha ao carregar obras para garantia."), []);
  const chamados =
    chamadosResult.status === "fulfilled"
      ? chamadosResult.value
      : (warnings.push("Falha ao carregar chamados de garantia (verifique migrations)."), []);
  const escaladosAutomaticamente =
    escalonamentoResult.status === "fulfilled"
      ? escalonamentoResult.value
      : (warnings.push("Falha ao aplicar escalonamento automático de SLA."), 0);
  const chamadoPrincipal = chamados[0];
  const interacoesResult = chamadoPrincipal ? await Promise.allSettled([listGarantiaInteracoes(chamadoPrincipal.id)]) : null;
  const interacoes =
    interacoesResult && interacoesResult[0].status === "fulfilled"
      ? interacoesResult[0].value
      : (chamadoPrincipal ? warnings.push("Falha ao carregar interações de garantia.") : null, []);

  const emAtendimento = chamados.filter((item) => item.status === "em_atendimento").length;
  const resolvidos = chamados.filter((item) => item.status === "resolvido").length;
  const resolvidosForaSla = chamados.filter((item) => {
    if (item.status !== "resolvido" || !item.resolvido_em) return false;
    const prazo = item.prazo_solucao_em ?? item.prazo_resposta_em;
    if (!prazo) return false;
    return new Date(item.resolvido_em).getTime() > new Date(prazo).getTime();
  }).length;
  const slaMedio = chamados.length > 0
    ? (chamados.reduce((acc, item) => acc + item.sla_horas, 0) / chamados.length).toFixed(1)
    : "0";

  return (
    <section className="of-page">
        <PageHeader
          eyebrow="Pós-entrega"
          title="Garantia e assistência"
          subtitle="Acompanhe chamados, SLA, escalonamento e comunicação de pós-obra."
          actions={
            <>
              <Link href="/entrega" className="of-btn-ghost">Voltar para entrega</Link>
              <Link href="/suporte" className="of-btn-primary">Abrir suporte</Link>
            </>
          }
        />
        {warnings.length > 0 ? (
          <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
            <div className="of-card-title">Dados carregados parcialmente</div>
            <p className="of-empty-text">{warnings.join(" ")}</p>
          </article>
        ) : null}

        <div className="of-stats-grid" style={{ marginBottom: 20 }}>
          <article className="of-stat-card">
            <div className="of-stat-value">{chamados.length}</div>
            <div className="of-stat-label">Total de chamados</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{emAtendimento}</div>
            <div className="of-stat-label">Em atendimento</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{resolvidosForaSla}</div>
            <div className="of-stat-label">Resolvidos fora SLA</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{slaMedio}h</div>
            <div className="of-stat-label">SLA médio</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{resolvidos}</div>
            <div className="of-stat-label">Resolvidos</div>
          </article>
          <article className="of-stat-card">
            <div className="of-stat-value">{escaladosAutomaticamente}</div>
            <div className="of-stat-label">Escalonados automático</div>
          </article>
        </div>

        <form action={createGarantiaChamadoAction} className="of-card of-form-grid md:grid-cols-3">
          <div className="of-card-title md:col-span-3">Pós-obra e garantia</div>
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
          <input name="unidade" className="of-input" placeholder="Unidade / pavimento / apto" />
          <input name="sistema" className="of-input" placeholder="Sistema afetado" required />
          <input name="titulo" className="of-input" placeholder="Título do chamado" required />
          <input name="descricao" className="of-input md:col-span-2" placeholder="Descrição do problema" required />
          <select name="criticidade" className="of-input" defaultValue="media">
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
          <input name="sla_horas" type="number" min={1} defaultValue={24} className="of-input" placeholder="SLA (h)" />
          <button type="submit" className="of-btn-primary">
            Abrir chamado
          </button>
        </form>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Chamados de garantia</div>
          <div className="of-table-wrap" style={{ border: 0 }}>
            <table className="of-table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Título</th>
                  <th>Criticidade</th>
                  <th>Status</th>
                  <th>SLA</th>
                  <th>Prazo</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {chamados.map((item) => (
                  <tr key={item.id}>
                    <td>{item.obra_nome}</td>
                    <td>{item.titulo}</td>
                    <td>{item.criticidade}</td>
                    <td>{item.status}</td>
                    <td className="of-mono">{item.sla_horas}h</td>
                    <td>
                      {(() => {
                        const prazo = item.prazo_solucao_em ?? item.prazo_resposta_em;
                        if (!prazo) return <span className="of-badge of-badge-yellow">Sem prazo</span>;
                        if (item.status !== "resolvido" || !item.resolvido_em) {
                          return <span className="of-badge of-badge-blue">Prazo definido</span>;
                        }
                        const foraSla = new Date(item.resolvido_em).getTime() > new Date(prazo).getTime();
                        return (
                          <span className={`of-badge ${foraSla ? "of-badge-red" : "of-badge-green"}`}>
                            {foraSla ? "Resolvido fora SLA" : "Resolvido no SLA"}
                          </span>
                        );
                      })()}
                    </td>
                    <td>
                      <form action={updateGarantiaStatusAction} style={{ display: "flex", gap: 8 }}>
                        <input type="hidden" name="chamado_id" value={item.id} />
                        <select name="status" className="of-input" defaultValue={item.status}>
                          <option value="aberto">Aberto</option>
                          <option value="em_atendimento">Em atendimento</option>
                          <option value="resolvido">Resolvido</option>
                        </select>
                        <button type="submit" className="of-btn-ghost">
                          Salvar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {chamados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="of-empty-text">
                      Sem chamados de garantia.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="of-card" style={{ marginTop: 20 }}>
          <div className="of-card-title">Interações do último chamado</div>
          {chamadoPrincipal ? (
            <>
              <form action={createGarantiaInteracaoAction} className="of-form-grid md:grid-cols-3" style={{ marginBottom: 12 }}>
                <input type="hidden" name="chamado_id" value={chamadoPrincipal.id} />
                <select name="tipo" className="of-input">
                  <option value="comentario">Comentário</option>
                  <option value="atualizacao">Atualização</option>
                </select>
                <input name="mensagem" className="of-input md:col-span-2" placeholder="Mensagem" required />
                <button type="submit" className="of-btn-primary md:col-span-3">
                  Registrar interação
                </button>
              </form>
              <div className="of-table-wrap" style={{ border: 0 }}>
                <table className="of-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Mensagem</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interacoes.map((item) => (
                      <tr key={item.id}>
                        <td>{item.tipo}</td>
                        <td>{item.mensagem}</td>
                        <td>{new Date(item.created_at).toLocaleString("pt-BR")}</td>
                      </tr>
                    ))}
                    {interacoes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="of-empty-text">
                          Sem interações para o chamado selecionado.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="of-empty-text">Abra um chamado para iniciar o histórico de garantia.</p>
          )}
        </article>
      </section>
  );
}
