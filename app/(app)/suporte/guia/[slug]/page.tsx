import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGuiaBySlug } from "../data";
import { PageHeader } from "@/components/molecules/page-header";

type GuiaDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type Hotspot = { x: number; y: number; label: string };

export const dynamic = "force-dynamic";

function nivelLabel(nivel: "inicial" | "intermediario" | "avancado") {
  if (nivel === "inicial") return "Inicial";
  if (nivel === "intermediario") return "Intermediario";
  return "Avancado";
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getStepHotspots(stepNumber: number): Hotspot[] {
  const maps: Hotspot[][] = [
    [
      { x: 10, y: 28, label: "Menu do modulo" },
      { x: 48, y: 18, label: "Busca/Filtro" },
      { x: 30, y: 36, label: "Card principal" },
    ],
    [
      { x: 31, y: 45, label: "Status da obra" },
      { x: 43, y: 52, label: "Progresso/Orcamento" },
      { x: 88, y: 10, label: "Nova acao" },
    ],
    [
      { x: 67, y: 36, label: "Painel de apoio" },
      { x: 80, y: 52, label: "Validador de dados" },
      { x: 72, y: 18, label: "Confirmacao" },
    ],
    [
      { x: 33, y: 78, label: "Checklist final" },
      { x: 56, y: 78, label: "Revisar pendencias" },
      { x: 81, y: 78, label: "Proximo passo" },
    ],
  ];
  return maps[stepNumber % 4];
}

function buildGuideReferenceSvg(input: { modulo: string; passoTitulo: string; passoNumero: number }) {
  const modulo = escapeSvgText(input.modulo);
  const passoTitulo = escapeSvgText(input.passoTitulo);
  const accent = ["#ff6b1a", "#3B7BFF", "#70BB81", "#8C7BFF"][input.passoNumero % 4];
  const hotspots = getStepHotspots(input.passoNumero)
    .map((spot, idx) => {
      const x = 42 + (spot.x / 100) * 960;
      const y = 52 + (spot.y / 100) * 486;
      const label = escapeSvgText(spot.label);
      return `
        <circle cx="${x}" cy="${y}" r="14" fill="${accent}" />
        <text x="${x - 4}" y="${y + 4}" font-size="13" font-family="Arial" fill="#081225" font-weight="700">${idx + 1}</text>
        <rect x="${x + 16}" y="${y - 12}" width="178" height="24" rx="12" fill="rgba(8, 20, 41, 0.88)" stroke="${accent}" />
        <text x="${x + 24}" y="${y + 4}" font-size="12" font-family="Arial" fill="#E9F1FF" font-weight="600">${label}</text>
      `;
    })
    .join("");

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1056" height="590" viewBox="0 0 1056 590">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#041229" />
          <stop offset="100%" stop-color="#0e2345" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1056" height="590" fill="#09172f" />
      <rect x="24" y="18" width="1008" height="554" rx="12" fill="url(#g1)" stroke="#253a60" />
      <text x="42" y="44" font-size="21" font-family="Arial" fill="#ecf3ff" font-weight="700">${modulo}</text>
      <text x="370" y="44" font-size="16" font-family="Arial" fill="#a8bbd8">${passoTitulo}</text>

      <rect x="42" y="52" width="124" height="486" rx="8" fill="#0b1933" stroke="#263b5f" />
      <text x="56" y="82" font-size="11" font-family="Arial" fill="#8fa6c8">PRINCIPAL</text>
      <text x="56" y="106" font-size="12" font-family="Arial" fill="#dbe8fd">Dashboard</text>
      <rect x="50" y="116" width="108" height="26" rx="6" fill="rgba(255,107,26,0.16)" stroke="#ff6b1a"/>
      <text x="56" y="133" font-size="12" font-family="Arial" fill="#ffd7bf">${modulo}</text>
      <text x="56" y="160" font-size="12" font-family="Arial" fill="#93aac8">Cronograma</text>
      <text x="56" y="186" font-size="12" font-family="Arial" fill="#93aac8">Financeiro</text>
      <text x="56" y="212" font-size="12" font-family="Arial" fill="#93aac8">Relatórios</text>

      <rect x="186" y="52" width="846" height="486" rx="8" fill="#06162f" stroke="#284062" />
      <rect x="196" y="62" width="672" height="24" rx="6" fill="#102444" stroke="#2f4d75" />
      <rect x="204" y="69" width="130" height="10" rx="5" fill="#243f68"/>
      <rect x="876" y="62" width="146" height="24" rx="6" fill="#13294a" stroke="#2f4d75" />
      <circle cx="892" cy="74" r="5" fill="#ffd34f"/>
      <circle cx="907" cy="74" r="5" fill="#6ee874"/>
      <rect x="936" y="64" width="74" height="20" rx="5" fill="#ff6b1a" />
      <text x="946" y="78" font-size="10" font-family="Arial" fill="#fff" font-weight="700">Nova Acao</text>

      <rect x="196" y="96" width="826" height="24" rx="6" fill="#102444" stroke="#2f4d75" />
      <rect x="206" y="103" width="610" height="10" rx="5" fill="#223f67"/>
      <rect x="824" y="100" width="52" height="14" rx="4" fill="#ff6b1a" opacity="0.9"/>
      <rect x="882" y="100" width="62" height="14" rx="4" fill="#1d3559"/>
      <rect x="948" y="100" width="62" height="14" rx="4" fill="#1d3559"/>
      <rect x="196" y="126" width="826" height="92" rx="10" fill="#0d223f" stroke="#2f4d75" />
      <rect x="206" y="108" width="392" height="100" rx="8" fill="#0b1d37" stroke="#2f4d75" />
      <rect x="610" y="108" width="402" height="100" rx="8" fill="#0b1d37" stroke="#2f4d75" />
      <text x="220" y="130" font-size="13" font-family="Arial" fill="#dce8fc" font-weight="700">Item Exemplo A</text>
      <text x="220" y="152" font-size="11" font-family="Arial" fill="#93aac8">Status e progresso</text>
      <rect x="220" y="165" width="160" height="4" rx="2" fill="#1f3a61"/>
      <rect x="220" y="165" width="72" height="4" rx="2" fill="#ff6b1a"/>
      <text x="624" y="130" font-size="13" font-family="Arial" fill="#dce8fc" font-weight="700">Item Exemplo B</text>
      <text x="624" y="152" font-size="11" font-family="Arial" fill="#93aac8">Status e progresso</text>
      <rect x="624" y="165" width="160" height="4" rx="2" fill="#1f3a61"/>
      <rect x="624" y="165" width="98" height="4" rx="2" fill="#ff6b1a"/>

      <rect x="196" y="230" width="826" height="298" rx="10" fill="#061428" stroke="#223b60" />
      <text x="208" y="252" font-size="12" font-family="Arial" fill="#8fa6c8">Area de trabalho / detalhes</text>
      <rect x="206" y="264" width="250" height="250" rx="8" fill="#0a1b35" stroke="#2b456d"/>
      <rect x="466" y="264" width="250" height="250" rx="8" fill="#0a1b35" stroke="#2b456d"/>
      <rect x="726" y="264" width="286" height="250" rx="8" fill="#0a1b35" stroke="#2b456d"/>

      ${hotspots}
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default async function GuiaDetailPage({ params }: GuiaDetailPageProps) {
  const { slug } = await params;
  const guia = getGuiaBySlug(slug);
  if (!guia) {
    notFound();
  }

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Guia operacional"
        title={`Guia completo: ${guia.titulo}`}
        subtitle={guia.resumo}
        actions={
          <>
            <span className="of-badge of-badge-blue">Nivel: {nivelLabel(guia.nivel)}</span>
            <span className="of-badge of-badge-green">Leitura: {guia.tempoMedioLeitura}</span>
            <span className="of-badge of-badge-purple">Guia operacional detalhado</span>
          </>
        }
      />

      <div className="of-dashboard-grid" style={{ marginBottom: 16 }}>
        <article className="of-card">
          <div className="of-card-title">Para que serve</div>
          <p className="of-list-description">{guia.paraQueServe}</p>
        </article>
        <article className="of-card">
          <div className="of-card-title">Quando usar</div>
          <p className="of-list-description">{guia.quandoUsar}</p>
        </article>
      </div>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Antes de comecar (checklist obrigatorio)</div>
        <ul className="of-list">
          {guia.preRequisitos.map((item) => (
            <li key={item} className="of-list-item">
              <p className="of-list-description">{item}</p>
            </li>
          ))}
        </ul>
      </article>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Prioridades operacionais deste modulo</div>
        <ul className="of-list">
          {guia.prioridadesOperacionais.map((item) => (
            <li key={item} className="of-list-item">
              <p className="of-list-description">• {item}</p>
            </li>
          ))}
        </ul>
      </article>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Resultado esperado</div>
        <p className="of-list-description">{guia.resultadoEsperado}</p>
      </article>

      <article className="of-card" style={{ marginBottom: 16 }}>
        <div className="of-card-title">Como usar (passo a passo super detalhado)</div>
        <div style={{ display: "grid", gap: 14 }}>
          {guia.passosDetalhados.map((passo, index) => (
            <article
              key={passo.titulo}
              style={{
                border: "1px solid var(--of-border)",
                borderRadius: 10,
                padding: 14,
                background: "var(--of-bg-3)",
              }}
            >
              <p style={{ fontWeight: 700, marginBottom: 8, color: "var(--of-text-1)" }}>
                {passo.titulo}
              </p>
              <p className="of-list-description" style={{ marginBottom: 8 }}>
                <strong>Objetivo:</strong> {passo.objetivo}
              </p>
              <p className="of-list-description" style={{ marginBottom: 12 }}>
                {passo.explicacao}
              </p>

              <div
                style={{
                  border: "1px solid var(--of-border)",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  background: "rgba(59, 123, 255, 0.06)",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", marginBottom: 8 }}>
                  {passo.imagem.titulo}
                </p>
                <Image
                  src={buildGuideReferenceSvg({
                    modulo: guia.titulo,
                    passoTitulo: passo.titulo,
                    passoNumero: index,
                  })}
                  alt={passo.imagem.legenda}
                  width={1056}
                  height={590}
                  unoptimized
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "block",
                  }}
                />
                <p className="of-list-description" style={{ marginTop: 8 }}>
                  {passo.imagem.legenda}
                </p>
              </div>

              <div className="of-dashboard-grid" style={{ gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 6, fontSize: "0.84rem" }}>
                    Acoes recomendadas
                  </p>
                  <ul className="of-list">
                    {passo.acoes.map((acao) => (
                      <li key={acao} className="of-list-item">
                        <p className="of-list-description">• {acao}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 6, fontSize: "0.84rem" }}>
                    Como validar que deu certo
                  </p>
                  <ul className="of-list">
                    {passo.validacao.map((item) => (
                      <li key={item} className="of-list-item">
                        <p className="of-list-description">✓ {item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <p style={{ fontWeight: 700, marginBottom: 6, fontSize: "0.84rem", color: "#ff9445" }}>
                  Se algo der errado
                </p>
                <ul className="of-list">
                  {passo.falhasComuns.map((erro) => (
                    <li key={erro} className="of-list-item">
                      <p className="of-list-description">{erro}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </article>

      <div className="of-dashboard-grid" style={{ gap: 16 }}>
        <article className="of-card">
          <div className="of-card-title">Boas praticas</div>
          <ul className="of-list">
            {guia.boasPraticas.map((dica) => (
              <li key={dica} className="of-list-item">
                <p className="of-list-description">• {dica}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="of-card">
          <div className="of-card-title">Erros comuns a evitar</div>
          <ul className="of-list">
            {guia.errosComuns.map((erro) => (
              <li key={erro} className="of-list-item">
                <p className="of-list-description">✕ {erro}</p>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="of-card" style={{ marginTop: 16 }}>
        <div className="of-card-title">Perguntas frequentes (FAQ)</div>
        <ul className="of-list">
          {guia.faq.map((item) => (
            <li key={item.pergunta} className="of-list-item">
              <p className="of-list-title">{item.pergunta}</p>
              <p className="of-list-description">{item.resposta}</p>
            </li>
          ))}
        </ul>
      </article>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
        <Link href={guia.rota} className="of-btn-primary" style={{ display: "inline-flex" }}>
          Ir para {guia.titulo}
        </Link>
        <Link href="/suporte/guia" className="of-btn-ghost" style={{ display: "inline-flex" }}>
          Voltar para todos os guias
        </Link>
      </div>
    </section>
  );
}
