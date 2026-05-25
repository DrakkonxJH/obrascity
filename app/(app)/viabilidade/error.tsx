"use client";

type ViabilidadeErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ViabilidadeError({ reset }: ViabilidadeErrorProps) {
  return (
    <section className="of-page">
      <article className="of-card" style={{ borderColor: "var(--of-yellow)" }}>
        <div className="of-card-title">Falha ao carregar viabilidade</div>
        <p className="of-empty-text" style={{ marginBottom: 12 }}>
          O módulo encontrou um erro inesperado. Tente recarregar esta aba.
        </p>
        <button type="button" className="of-btn-primary" onClick={reset}>
          Recarregar viabilidade
        </button>
      </article>
    </section>
  );
}
