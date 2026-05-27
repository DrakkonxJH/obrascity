import Link from "next/link";

export const metadata = {
  title: "Política de Cookies — ObrasCitY",
  description: "Saiba como a ObrasCitY utiliza cookies e tecnologias similares em nossa plataforma.",
};

export default function PoliticaCookiesPage() {
  return (
    <main style={{ background: "#060810", color: "#F0F4FF", minHeight: "100vh", fontFamily: "Barlow, sans-serif" }}>
      <nav style={{ background: "#0C1018", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#FFF", fontWeight: 700, fontSize: "1.1rem" }}>
          <span style={{ fontSize: "1.4rem" }}>🏗</span> OBRAS<em style={{ color: "#FF6B1A", fontStyle: "normal" }}>CITY</em>
        </a>
        <Link href="/login" style={{ color: "#8896B3", fontSize: "0.9rem", textDecoration: "none" }}>Entrar →</Link>
      </nav>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 5%" }}>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 900, marginBottom: 8 }}>Política de Cookies</h1>
        <p style={{ color: "#8896B3", marginBottom: 40 }}>Última atualização: {new Date().toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" })}</p>

        {[
          { title: "O que são cookies?", text: "Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita um site. Eles permitem que o site lembre suas preferências e melhore sua experiência." },
          { title: "Quais cookies utilizamos?", text: "Utilizamos cookies estritamente necessários (autenticação e sessão), cookies de desempenho (métricas anônimas de uso via ferramentas analíticas) e cookies de funcionalidade (preferências de interface). Não utilizamos cookies de rastreamento publicitário." },
          { title: "Cookies essenciais", text: "São necessários para o funcionamento básico da plataforma, como manter você autenticado durante sua sessão. Não podem ser desativados." },
          { title: "Cookies analíticos", text: "Utilizamos dados agregados e anonimizados para entender como a plataforma é usada e melhorá-la continuamente. Esses dados não identificam você individualmente." },
          { title: "Como gerenciar cookies?", text: "Você pode configurar seu navegador para recusar cookies ou alertar quando um cookie estiver sendo enviado. Isso pode afetar algumas funcionalidades da plataforma." },
          { title: "Conformidade com LGPD", text: "Nossa política de cookies segue as diretrizes da Lei Geral de Proteção de Dados (Lei 13.709/2018). Para exercer seus direitos de titular, acesse sua conta → Configurações → Privacidade." },
        ].map((section) => (
          <section key={section.title} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8, color: "#FF6B1A" }}>{section.title}</h2>
            <p style={{ color: "#8896B3", lineHeight: 1.8 }}>{section.text}</p>
          </section>
        ))}

        <p style={{ color: "#8896B3", marginTop: 48, fontSize: "0.9rem" }}>
          Dúvidas? Entre em <Link href="/contato" style={{ color: "#FF6B1A" }}>contato</Link> ou consulte nossa <Link href="/privacidade" style={{ color: "#FF6B1A" }}>Política de Privacidade</Link>.
        </p>
      </div>
    </main>
  );
}
