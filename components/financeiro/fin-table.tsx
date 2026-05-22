type FinTableProps = {
  rows: Array<{ categoria: string; orcado: number; realizado: number }>;
};

export function FinTable({ rows }: FinTableProps) {
  return (
    <table className="w-full border-collapse overflow-hidden rounded-xl border border-white/10 bg-[#0d1120] text-sm text-[#e8edf8]">
      <thead>
        <tr className="border-b border-white/10 bg-[#121929] text-left">
          <th className="px-3 py-2">Categoria</th>
          <th className="px-3 py-2">Orcado</th>
          <th className="px-3 py-2">Realizado</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.categoria} className="border-b border-white/5">
            <td className="px-3 py-2">{row.categoria}</td>
            <td className="px-3 py-2">{row.orcado}</td>
            <td className="px-3 py-2">{row.realizado}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
