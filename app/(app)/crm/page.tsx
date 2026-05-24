import { requireClientProfileForPage } from "@/lib/auth/client-account";

export default async function CrmPage() {
  await requireClientProfileForPage();

  return (
    <section className="of-page">
      <div className="of-inline-header" style={{ marginBottom: 16, alignItems: "center" }}>
        <div>
          <h1 className="of-page-title" style={{ marginBottom: 6 }}>
            CRM
          </h1>
          <p className="of-empty-text">
            Em desenvolvimento. Volte em breve.
          </p>
        </div>
      </div>

      <article className="of-card">
        <p className="of-empty-text">
          O módulo CRM está sendo reconstruído do zero.
        </p>
      </article>
    </section>
  );
}
