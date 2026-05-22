import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./legal-page-shell.module.css";

type LegalPageShellProps = {
  title: string;
  children: ReactNode;
};

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  const currentYear = new Date().getFullYear();

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 8% 10%, rgba(255, 107, 26, 0.08) 0%, transparent 40%), linear-gradient(90deg, rgba(255, 107, 26, 0.08), transparent 40%), #050911",
        color: "#eef3ff",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(6, 10, 20, 0.92)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Link href="/landing.html" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: "grid",
                placeItems: "center",
                background: "linear-gradient(135deg, #ff8a2d, #ff6200)",
              }}
            >
              🏗
            </div>
            <strong style={{ fontFamily: "Barlow Condensed, sans-serif", fontSize: "1.7rem", letterSpacing: ".03em" }}>
              OBRAS<span style={{ color: "#ff7b21" }}>FLOW</span>
            </strong>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/login"
              style={{
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                padding: "9px 16px",
                fontSize: ".88rem",
                color: "#d8e0f4",
              }}
            >
              Entrar
            </Link>
            <Link href="/cadastro" className="of-btn-primary">
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: 980, margin: "0 auto", padding: "56px 24px 64px" }}>
        <article className="of-login-v2-card" style={{ width: "100%" }}>
          <h1 className="of-page-title" style={{ marginBottom: 16 }}>
            {title}
          </h1>
          <div style={{ display: "grid", gap: 14 }}>{children}</div>
        </article>
      </section>

      <footer className={styles.legalFooter}>
        <div className={styles.footerContainer}>
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.navLogo}>
                <div className={styles.navLogoMark}>🏗</div>
                <div className={styles.navLogoText}>
                  OBRAS<em>FLOW</em>
                </div>
              </div>
              <p className={styles.footerBrandDesc}>
                A plataforma de gestão de obras para construtoras que levam seus projetos a sério. Do planejamento à
                entrega.
              </p>
            </div>
            <div>
              <div className={styles.footerColTitle}>Produto</div>
              <div className={styles.footerLinks}>
                <Link href="/landing.html#solucao" className={styles.footerLink}>
                  Como funciona
                </Link>
                <Link href="/landing.html#numeros" className={styles.footerLink}>
                  Resultados
                </Link>
                <Link href="/landing.html#modulos" className={styles.footerLink}>
                  Módulos
                </Link>
                <Link href="/landing.html" className={styles.footerLink}>
                  Planos e preços
                </Link>
              </div>
            </div>
            <div>
              <div className={styles.footerColTitle}>Empresa</div>
              <div className={styles.footerLinks}>
                <Link href="/landing.html#hero" className={styles.footerLink}>
                  Sobre nós
                </Link>
                <Link href="/landing.html#depoimentos" className={styles.footerLink}>
                  Clientes
                </Link>
                <Link href="/landing.html#cta-final" className={styles.footerLink}>
                  Contato
                </Link>
              </div>
            </div>
            <div>
              <div className={styles.footerColTitle}>Suporte</div>
              <div className={styles.footerLinks}>
                <Link href="/landing.html#faq" className={styles.footerLink}>
                  Perguntas frequentes
                </Link>
                <Link href="/privacidade" className={styles.footerLink}>
                  Política de privacidade
                </Link>
                <Link href="/termos" className={styles.footerLink}>
                  Termos de uso
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>
              © {currentYear} ObrasFlow. Plataforma SaaS de gestão de obras. Informações legais e comerciais
              disponíveis no site.
            </span>
            <div className={styles.footerBadges}>
              <span className={styles.badge}>🔒 SSL</span>
              <span className={styles.badge}>✓ LGPD</span>
              <span className={styles.badge}>⚙ ISO 27001</span>
              <span className={styles.badge}>☁ 99.9% Uptime</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
