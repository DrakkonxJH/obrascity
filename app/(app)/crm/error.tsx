"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <section className="of-page">
      <article className="of-card" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <h2 style={{ marginBottom: 8 }}>Algo deu errado</h2>
        <p className="of-empty-text" style={{ marginBottom: 16 }}>{error.message || "Erro inesperado. Tente novamente."}</p>
        <button className="of-btn of-btn-primary" onClick={reset}>Tentar novamente</button>
      </article>
    </section>
  );
}
