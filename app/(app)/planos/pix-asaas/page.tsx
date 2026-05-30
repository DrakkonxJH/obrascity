import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ sub?: string }> };

function getAsaasBaseUrl() {
  const apiKey = process.env.ASAAS_API_KEY ?? "";
  return apiKey.startsWith("$aact_") ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3";
}

export default async function PixAsaasPage({ searchParams }: Props) {
  const params = await searchParams;
  const subId = params.sub;
  if (!subId) redirect("/planos");

  const apiKey = process.env.ASAAS_API_KEY ?? "";
  let pixPayload: string | null = null;
  let pixQrCode: string | null = null;
  let dueDate: string | null = null;
  let value: number | null = null;

  try {
    const paymentsRes = await fetch(`${getAsaasBaseUrl()}/subscriptions/${subId}/payments?limit=1`, {
      headers: { access_token: apiKey },
      cache: "no-store",
    });
    if (paymentsRes.ok) {
      const data = (await paymentsRes.json()) as {
        data?: Array<{ id?: string; dueDate?: string; value?: number }>;
      };
      const payment = data.data?.[0];
      if (payment?.id) {
        dueDate = payment.dueDate ?? null;
        value = payment.value ?? null;
        const pixRes = await fetch(`${getAsaasBaseUrl()}/payments/${payment.id}/pixQrCode`, {
          headers: { access_token: apiKey },
          cache: "no-store",
        });
        if (pixRes.ok) {
          const pixData = (await pixRes.json()) as { encodedImage?: string; payload?: string };
          pixQrCode = pixData.encodedImage ?? null;
          pixPayload = pixData.payload ?? null;
        }
      }
    }
  } catch {
    // best-effort
  }

  return (
    <section className="of-page">
      <div className="of-page-title" style={{ marginBottom: 4 }}>
        Pagamento via PIX — Asaas
      </div>
      <p className="of-empty-text" style={{ marginBottom: 24 }}>
        Escaneie o QR Code ou copie o código PIX abaixo para ativar sua assinatura.
      </p>

      <article className="of-card" style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
        {pixQrCode ? (
          <Image
            src={`data:image/png;base64,${pixQrCode}`}
            alt="QR Code PIX"
            width={240}
            height={240}
            unoptimized
            style={{ width: 240, height: 240, margin: "0 auto 20px", display: "block", borderRadius: 8 }}
          />
        ) : (
          <div
            style={{
              width: 240,
              height: 240,
              background: "var(--of-surface)",
              borderRadius: 8,
              margin: "0 auto 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--of-text-secondary)",
            }}
          >
            QR Code indisponível
          </div>
        )}

        {value ? (
          <p style={{ fontWeight: 700, fontSize: "1.4rem", marginBottom: 8 }}>
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)}
          </p>
        ) : null}
        {dueDate ? (
          <p className="of-empty-text" style={{ marginBottom: 16 }}>
            Vence em: {new Date(`${dueDate}T00:00:00`).toLocaleDateString("pt-BR")}
          </p>
        ) : null}

        {pixPayload ? (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: "0.85rem", color: "var(--of-text-secondary)", marginBottom: 8 }}>
              Copia e Cola PIX:
            </p>
            <div
              style={{
                background: "var(--of-surface)",
                border: "1px solid var(--of-border)",
                borderRadius: 8,
                padding: "10px 14px",
                wordBreak: "break-all",
                fontSize: "0.8rem",
                fontFamily: "monospace",
                textAlign: "left",
              }}
            >
              {pixPayload}
            </div>
          </div>
        ) : (
          <p className="of-empty-text">PIX indisponível no momento. Acesse seu e-mail para o link de pagamento.</p>
        )}

        <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/planos" className="of-btn-ghost">
            ← Voltar aos planos
          </Link>
          <Link href="/planos" className="of-btn of-btn-primary">
            Já paguei
          </Link>
        </div>
      </article>
    </section>
  );
}
