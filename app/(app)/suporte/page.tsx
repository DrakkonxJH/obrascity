import Link from "next/link";
import { listGuias } from "./guia/data";
import { AiSupportChat } from "@/components/support/ai-support-chat";

const canais = [
  {
    titulo: "Atendimento prioritario",
    descricao: "Suporte para incidentes que impactam a operacao da obra.",
    disponibilidade: "Seg a Sex · 08h as 18h",
    contato: "suporte@obrascity.com",
  },
  {
    titulo: "Suporte comercial",
    descricao: "Dvidas sobre plano, upgrade, perfis adicionais e condicoes comerciais.",
    disponibilidade: "Seg a Sex · 09h as 18h",
    contato: "comercial@obrascity.com",
  },
  {
    titulo: "Onboarding e treinamento",
    descricao: "Acompanhamento para adocao da plataforma com o seu time.",
    disponibilidade: "Agendamento",
    contato: "onboarding@obrascity.com",
  },
];

export default function SuportePage() {
  const totalGuias = listGuias().length;

  return (
    <section className="of-page">
      <div className="of-inline-header" style={{ marginBottom: 20, alignItems: "flex-start" }}>
        <div>
          <h1 className="of-page-title" style={{ marginBottom: 6 }}>
            SAC e Guia de Uso
          </h1>
          <p className="of-empty-text">
            Central de atendimento e orientacoes praticas para sua equipe usar o ObrasCitY com
            segurança e produtividade.
          </p>
        </div>
      </div>

      <div className="of-dashboard-grid" style={{ marginBottom: 20 }}>
        {canais.map((canal) => (
          <article key={canal.titulo} className="of-card">
            <div className="of-card-title">{canal.titulo}</div>
            <p className="of-list-description" style={{ marginBottom: 8 }}>
              {canal.descricao}
            </p>
            <p className="of-list-description">
              <strong>Disponibilidade:</strong> {canal.disponibilidade}
            </p>
            <p className="of-list-description">
              <strong>Contato:</strong>{" "}
              <a href={`mailto:${canal.contato}`} style={{ color: "#ff9445" }}>
                {canal.contato}
              </a>
            </p>
          </article>
        ))}
      </div>

      <article className="of-card" style={{ marginBottom: 20 }}>
        <div className="of-card-title">Guia completo da plataforma</div>
        <p className="of-list-description" style={{ marginBottom: 14 }}>
          Disponibilizamos um guia completo por modulo, com orientacao de para que serve, quando
          usar, passo a passo, boas praticas e erros comuns.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/suporte/guia" className="of-btn-primary" style={{ display: "inline-flex" }}>
            Acessar guia completo
          </Link>
          <span className="of-badge of-badge-blue">{totalGuias} modulos documentados</span>
        </div>
      </article>

      <AiSupportChat />

      <article className="of-card">
        <div className="of-card-title">Boas praticas recomendadas</div>
        <ul className="of-list">
          <li className="of-list-item">
            <p className="of-list-title">1. Defina papéis e acessos por função</p>
            <p className="of-list-description">
              Use perfis para limitar o que cada funcionario pode visualizar e editar.
            </p>
          </li>
          <li className="of-list-item">
            <p className="of-list-title">2. Padronize rotina de atualizacao de obra</p>
            <p className="of-list-description">
              Atualize progresso, materiais e diario com frequencia para manter previsibilidade.
            </p>
          </li>
          <li className="of-list-item">
            <p className="of-list-title">3. Gere relatórios semanais para decisao</p>
            <p className="of-list-description">
              Compartilhe indicadores com lideranca e cliente para reduzir retrabalho.
            </p>
          </li>
        </ul>
      </article>
    </section>
  );
}
