import Link from "next/link";

export default function Home() {
  return (
    <main className="of-page" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <section className="of-card" style={{ maxWidth: 720, width: "100%", textAlign: "center" }}>
        <p className="of-badge of-badge-blue" style={{ marginBottom: 16 }}>
          ObrasFlow
        </p>
        <h1 className="of-page-title" style={{ marginBottom: 12 }}>
          Plataforma de gestão de obras
        </h1>
        <p className="of-empty-text" style={{ marginBottom: 24 }}>
          Acesse sua conta para continuar ou entre no painel principal.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/login" className="of-btn-primary" style={{ display: "inline-flex" }}>
            Entrar
          </Link>
          <Link href="/dashboard" className="of-btn-ghost" style={{ display: "inline-flex" }}>
            Abrir dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
