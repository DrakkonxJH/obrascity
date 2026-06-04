import Link from "next/link";
import { listGuias } from "./guia/data";
import { AiSupportChat } from "@/components/support/ai-support-chat";
import { PageHeader } from "@/components/ui/page-header";

export default function SuportePage() {
  const totalGuias = listGuias().length;

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Suporte"
        title="SAC e guia de uso"
        subtitle="Central de atendimento e orientacoes praticas para sua equipe usar o ObrasCitY com segurança e produtividade."
      />

      <article className="of-card" style={{ marginBottom: 20 }}>
        <div className="of-card-title">Canal oficial de atendimento</div>
        <p className="of-list-description" style={{ marginBottom: 12 }}>
          Para clientes cadastrados, o atendimento ocorre exclusivamente pelo chat abaixo. Use esse canal para relatar erros, dúvidas de uso e incidentes operacionais. Não exibimos e-mail direto de administração ou conta master.
        </p>
        <p className="of-list-description">
          Se o caso exigir análise humana, a conversa pode ser convertida em ticket a partir do próprio chat.
        </p>
      </article>

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
