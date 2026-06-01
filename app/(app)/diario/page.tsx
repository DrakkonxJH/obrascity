import { listObras } from "@/lib/db/obras";
import { listDiarios } from "@/lib/db/diario";
import { createDiarioAction } from "./actions";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("pt-BR") : value || "—";
}

export default async function DiarioPage() {
  const [obrasResult, diariosResult] = await Promise.allSettled([listObras(), listDiarios()]);
  const warnings: string[] = [];
  const obras =
    obrasResult.status === "fulfilled"
      ? obrasResult.value
      : (warnings.push("Falha ao carregar obras para diário."), []);
  const diarios =
    diariosResult.status === "fulfilled"
      ? diariosResult.value
      : (warnings.push("Falha ao carregar registros do diário (verifique migrations pendentes)."), []);

  const agora = new Date();
  const totalRegistros = diarios.length;
  const registrosEsteMes = diarios.filter((item) => {
    const data = new Date(`${item.data_ref}T00:00:00`);
    return (
      Number.isFinite(data.getTime()) &&
      data.getMonth() === agora.getMonth() &&
      data.getFullYear() === agora.getFullYear()
    );
  }).length;
  const totalEvidencias = diarios.reduce((acc, item) => acc + item.evidencias.length, 0);
  const efetivoMedio = diarios.length > 0
    ? (diarios.reduce((acc, item) => acc + item.efetivo, 0) / diarios.length).toFixed(1)
    : "0";
  const ultimasOcorrencias = diarios.filter((item) => item.ocorrencias && item.ocorrencias.trim().length > 0).slice(0, 3);

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Execução"
        title="Diário de obra"
        subtitle="Registro diário operacional com clima, efetivo, evidências e ocorrências de campo."
        actions={
          <>
            <Link href="/relatorios/diario" className="of-btn-ghost">Ver relatório</Link>
            <Link href="/obras" className="of-btn-primary">Ver obras</Link>
          </>
        }
      />
      {warnings.length > 0 ? (
        <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
          <div className="of-card-title">Dados carregados parcialmente</div>
          <p className="of-empty-text">{warnings.join(" ")}</p>
        </article>
      ) : null}
      <p className="of-empty-text" style={{ marginBottom: 16 }}>
        Registro operacional diário com dados de campo e evidências.
      </p>

      <div className="of-stats-grid" style={{ marginBottom: 20 }}>
        <article className="of-stat-card">
          <div className="of-stat-value">{totalRegistros}</div>
          <div className="of-stat-label">Total de registros</div>
        </article>
        <article className="of-stat-card">
          <div className="of-stat-value">{registrosEsteMes}</div>
          <div className="of-stat-label">Registros este mês</div>
        </article>
        <article className="of-stat-card">
          <div className="of-stat-value">{totalEvidencias}</div>
          <div className="of-stat-label">Total de evidências</div>
        </article>
        <article className="of-stat-card">
          <div className="of-stat-value">{efetivoMedio}</div>
          <div className="of-stat-label">Efetivo médio</div>
        </article>
      </div>

      <form action={createDiarioAction} encType="multipart/form-data" className="of-card of-form-grid md:grid-cols-3" style={{ marginBottom: 20 }}>
        <div className="of-card-title md:col-span-3">Novo registro (RDO)</div>
        <select name="obra_id" required defaultValue="" className="of-input">
          <option value="" disabled>
            Selecione a obra
          </option>
          {obras.map((obra) => (
            <option key={obra.id} value={obra.id}>
              {obra.nome}
            </option>
          ))}
        </select>
        <input name="data_ref" required type="date" className="of-input" />
        <input name="clima" placeholder="Clima (ex: ensolarado)" className="of-input" />
        <input name="efetivo" type="number" defaultValue="0" placeholder="Efetivo" className="of-input" />
        <input name="equipamentos" placeholder="Equipamentos utilizados" className="of-input" />
        <input name="assinatura_url" placeholder="URL da assinatura digital" className="of-input" />
        <input name="evidencias" type="file" multiple className="of-input md:col-span-2" />
        <input name="descricao_evidencias" placeholder="Descrição das evidências anexadas" className="of-input" />
        <textarea name="ocorrencias" placeholder="Ocorrências" className="of-input md:col-span-2" />
        <textarea name="observacoes_ssma" placeholder="Observações SSMA" className="of-input" />
        <div className="md:col-span-3">
          <button type="submit" className="of-btn-primary">
            Salvar diário
          </button>
        </div>
      </form>

      <div className="of-table-wrap">
        <table className="of-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Obra</th>
              <th>Clima</th>
              <th>Efetivo</th>
              <th>Evidências</th>
            </tr>
          </thead>
          <tbody>
            {diarios.map((d) => (
              <tr key={d.id}>
                <td className="of-mono">{d.data_ref}</td>
                <td>{d.obra_nome}</td>
                <td>{d.clima ?? "—"}</td>
                <td>{d.efetivo}</td>
                <td>
                  {d.evidencias.length > 0 ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {d.evidencias.slice(0, 2).map((evidencia) => (
                        <a
                          key={evidencia.id}
                          href={evidencia.arquivo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#ff9445] hover:underline text-sm"
                        >
                          Evidência
                        </a>
                      ))}
                      {d.evidencias.length > 2 ? <span className="of-empty-text">+{d.evidencias.length - 2}</span> : null}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
            {diarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="of-empty-text">
                  Nenhum diário registrado.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <article className="of-card" style={{ marginTop: 20 }}>
        <div className="of-card-title">Últimas ocorrências</div>
        {ultimasOcorrencias.length > 0 ? (
          <ul className="of-list">
            {ultimasOcorrencias.map((item) => (
              <li key={item.id} className="of-list-item">
                <p className="of-list-title">
                  {item.obra_nome} · {formatDate(item.data_ref)}
                </p>
                <p className="of-list-description">{item.ocorrencias}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="of-empty-text">Nenhuma ocorrência recente registrada.</p>
        )}
      </article>
    </section>
  );
}
