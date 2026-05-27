import Link from "next/link";

export const metadata = {
  title: "Sobre nós — ObrasCitY",
  description: "Conheça a história, missão e visão da ObrasCitY, a plataforma de gestão de obras para construtoras brasileiras.",
};

export default function SobrePage() {
  return (
    <main style={{ background: "#060810", color: "#F0F4FF", minHeight: "100vh", fontFamily: "Barlow, sans-serif" }}>
      <nav style={{ background: "#0C1018", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#FFF", fontWeight: 700, fontSize: "1.1rem" }}>
          <span style={{ fontSize: "1.4rem" }}>🏗</span> OBRAS<em style={{ color: "#FF6B1A", fontStyle: "normal" }}>CITY</em>
        </a>
        <Link href="/cadastro" style={{ background: "#FF6B1A", color: "#FFF", padding: "10px 24px", borderRadius: 8, fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>Começar grátis →</Link>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 5%" }}>
        <p style={{ color: "#FF6B1A", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: 2 }}>Nossa História</p>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, marginBottom: 24 }}>Construída por quem entende de obra</h1>
        <p style={{ color: "#8896B3", fontSize: "1.1rem", lineHeight: 1.8, marginBottom: 40 }}>
          A ObrasCitY nasceu da frustração com planilhas desatualizadas, relatórios manuais e comunicação fragmentada entre escritório e canteiro. Criamos uma plataforma que reúne tudo que um gestor de obras precisa — do planejamento à entrega — em um único lugar.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, marginBottom: 60 }}>
          {[
            { icon: "🎯", title: "Missão", text: "Transformar a gestão de obras no Brasil com tecnologia acessível e prática." },
            { icon: "🔭", title: "Visão", text: "Ser a plataforma de referência para construtoras de todos os portes no Brasil." },
            { icon: "🤝", title: "Valores", text: "Transparência, inovação contínua, suporte real e foco total no cliente." },
          ].map((item) => (
            <div key={item.title} style={{ background: "#0C1018", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>{item.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>{item.title}</h3>
              <p style={{ color: "#8896B3", fontSize: "0.9rem", lineHeight: 1.6 }}>{item.text}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 16 }}>Por que a ObrasCitY?</h2>
        <ul style={{ color: "#8896B3", lineHeight: 2, paddingLeft: 20, marginBottom: 40 }}>
          <li>100% em nuvem — acesse de qualquer dispositivo, em qualquer lugar</li>
          <li>Dados isolados por empresa — total privacidade e segurança (LGPD)</li>
          <li>Suporte em português, com time especializado em construção civil</li>
          <li>Implantação em menos de 24h, sem necessidade de TI</li>
          <li>Planos para todas as fases: startups, PMEs e grandes construtoras</li>
        </ul>

        <div style={{ background: "#FF6B1A", borderRadius: 16, padding: "40px 32px", textAlign: "center" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 12 }}>Pronto para transformar sua operação?</h3>
          <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 24 }}>14 dias grátis, sem cartão de crédito, sem burocracia.</p>
          <Link href="/cadastro" style={{ background: "#FFF", color: "#FF6B1A", padding: "14px 36px", borderRadius: 8, fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>Começar agora →</Link>
        </div>
      </div>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "32px 5%", textAlign: "center", color: "#8896B3", fontSize: "0.85rem" }}>
        © {new Date().getFullYear()} ObrasCitY · <Link href="/privacidade" style={{ color: "#8896B3" }}>Privacidade</Link> · <Link href="/termos" style={{ color: "#8896B3" }}>Termos</Link> · <Link href="/contato" style={{ color: "#8896B3" }}>Contato</Link>
      </footer>
    </main>
  );
}
