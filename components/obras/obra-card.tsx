type ObraCardProps = {
  nome: string;
  cliente: string;
  progresso: number;
};

export function ObraCard({ nome, cliente, progresso }: ObraCardProps) {
  return (
    <article className="of-list-item">
      <h3 className="of-list-title">{nome}</h3>
      <p className="of-list-description">Cliente: {cliente}</p>
      <div className="mt-3">
        <div className="of-progress-bar">
          <div className="of-progress-fill" style={{ width: `${progresso}%`, background: "var(--of-blue)" }} />
        </div>
        <p className="mt-1 text-xs text-[#94a3c3]">Progresso: {progresso}%</p>
      </div>
    </article>
  );
}
