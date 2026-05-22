import { listObras } from "@/lib/db/obras";
import { listDiarios } from "@/lib/db/diario";
import { createDiarioAction } from "./actions";

export default async function DiarioPage() {
  const [obras, diarios] = await Promise.all([listObras(), listDiarios()]);

  return (
    <section className="of-page">
      <p className="of-empty-text" style={{ marginBottom: 16 }}>
        Registro operacional diário com dados de campo e evidências.
      </p>

      <form action={createDiarioAction} className="of-card of-form-grid md:grid-cols-3" style={{ marginBottom: 20 }}>
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
        <textarea name="ocorrencias" placeholder="Ocorrências" className="of-input md:col-span-2" />
        <textarea name="observações_ssma" placeholder="Observações SSMA" className="of-input" />
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
            </tr>
          </thead>
          <tbody>
            {diarios.map((d) => (
              <tr key={d.id}>
                <td className="of-mono">{d.data_ref}</td>
                <td>{d.obra_nome}</td>
                <td>{d.clima ?? "—"}</td>
                <td>{d.efetivo}</td>
              </tr>
            ))}
            {diarios.length === 0 ? (
              <tr>
                <td colSpan={4} className="of-empty-text">
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
