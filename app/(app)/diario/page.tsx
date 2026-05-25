import { listObras } from "@/lib/db/obras";
import { listDiarios } from "@/lib/db/diario";
import { createDiarioAction } from "./actions";

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

  return (
    <section className="of-page">
      {warnings.length > 0 ? (
        <article className="of-card" style={{ marginBottom: 16, borderColor: "var(--of-yellow)" }}>
          <div className="of-card-title">Dados carregados parcialmente</div>
          <p className="of-empty-text">{warnings.join(" ")}</p>
        </article>
      ) : null}
      <p className="of-empty-text" style={{ marginBottom: 16 }}>
        Registro operacional diário com dados de campo e evidências.
      </p>

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
    </section>
  );
}
