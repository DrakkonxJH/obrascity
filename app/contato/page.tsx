import Link from "next/link";

export const metadata = {
  title: "Contato — ObrasCitY",
  description: "Entre em contato com a equipe ObrasCitY. Estamos prontos para ajudar sua construtora a crescer.",
};

export default function ContatoPage() {
  return (
    <main style={{ background: "#060810", color: "#F0F4FF", minHeight: "100vh", fontFamily: "Barlow, sans-serif" }}>
      <nav style={{ background: "#0C1018", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#FFF", fontWeight: 700, fontSize: "1.1rem" }}>
          <span style={{ fontSize: "1.4rem" }}>🏗</span> OBRAS<em style={{ color: "#FF6B1A", fontStyle: "normal" }}>CITY</em>
        </a>
        <Link href="/cadastro" style={{ background: "#FF6B1A", color: "#FFF", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>Começar grátis →</Link>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 5%" }}>
        <p style={{ color: "#FF6B1A", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: 2 }}>Fale conosco</p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, marginBottom: 12 }}>Entre em contato</h1>
        <p style={{ color: "#8896B3", fontSize: "1.05rem", marginBottom: 48 }}>Nossa equipe responde em até 1 dia útil. Para suporte de clientes, acesse o SAC dentro da plataforma.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 48 }}>
          {[
            { icon: "💬", title: "Vendas", text: "Interessado em conhecer os planos? Fale com nosso time comercial.", link: "mailto:vendas@obrascity.com.br", label: "vendas@obrascity.com.br" },
            { icon: "🆘", title: "Suporte", text: "Clientes com dúvidas técnicas ou problemas na plataforma.", link: "mailto:suporte@obrascity.com.br", label: "suporte@obrascity.com.br" },
            { icon: "🤝", title: "Parcerias", text: "Integrações, revendas e programas de parceiro.", link: "mailto:parcerias@obrascity.com.br", label: "parcerias@obrascity.com.br" },
            { icon: "📰", title: "Imprensa", text: "Jornalistas e veículos de comunicação.", link: "mailto:imprensa@obrascity.com.br", label: "imprensa@obrascity.com.br" },
          ].map((item) => (
            <div key={item.title} style={{ background: "#0C1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>{item.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ color: "#8896B3", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: 12 }}>{item.text}</p>
              <a href={item.link} style={{ color: "#FF6B1A", fontSize: "0.9rem" }}>{item.label}</a>
            </div>
          ))}
        </div>

        <div style={{ background: "#0C1018", border: "1px solid rgba(255,107,26,0.3)", borderRadius: 16, padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🚀</div>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 8 }}>Prefere experimentar antes?</h3>
          <p style={{ color: "#8896B3", marginBottom: 24 }}>Crie sua conta gratuita e veja tudo funcionando em minutos.</p>
          <Link href="/cadastro" style={{ background: "#FF6B1A", color: "#FFF", padding: "14px 36px", borderRadius: 8, fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>14 dias grátis →</Link>
        </div>
      </div>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "32px 5%", textAlign: "center", color: "#8896B3", fontSize: "0.85rem" }}>
        © {new Date().getFullYear()} ObrasCitY · <Link href="/privacidade" style={{ color: "#8896B3" }}>Privacidade</Link> · <Link href="/termos" style={{ color: "#8896B3" }}>Termos</Link>
      </footer>
    </main>
  );
}
