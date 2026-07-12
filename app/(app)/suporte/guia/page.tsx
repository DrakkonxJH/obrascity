import Link from "next/link";
import { listGuias } from "./data";
import { PageHeader } from "@/components/molecules/page-header";

export const dynamic = "force-dynamic";

export default function GuiaPage() {
  const guias = listGuias();

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Base de conhecimento"
        title="Guia completo da plataforma"
        subtitle="Selecione o modulo para aprender para que serve, quando usar e o passo a passo operacional."
      />

      <div
        className="of-dashboard-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}
      >
        {guias.map((guia) => (
          <article key={guia.slug} className="of-card">
            <div className="of-card-title">{guia.titulo}</div>
            <p className="of-list-description" style={{ marginBottom: 10 }}>
              {guia.resumo}
            </p>
            <p className="of-list-description" style={{ marginBottom: 12 }}>
              <strong>Quando usar:</strong> {guia.quandoUsar}
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link
                href={`/suporte/guia/${guia.slug}`}
                className="of-btn-primary"
                style={{ display: "inline-flex" }}
              >
                Abrir guia completo
              </Link>
              <Link href={guia.rota} className="of-btn-ghost" style={{ display: "inline-flex" }}>
                Ir para modulo
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
