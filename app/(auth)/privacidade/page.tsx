import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function PrivacidadePage() {
  return (
    <LegalPageShell title="Política de Privacidade (LGPD)">
      <p className="of-empty-text">
        O ObrasFlow trata dados pessoais para autenticação, operação da plataforma, segurança e suporte.
        Os tratamentos seguem princípios de necessidade, finalidade e minimização.
      </p>
      <p className="of-empty-text">
        O titular pode solicitar acesso, correção, portabilidade e exclusão/anonimização dos seus dados pela
        área de Configurações → Segurança e LGPD.
      </p>
      <p className="of-empty-text">
        Dados sensíveis operacionais podem ser protegidos com criptografia AES-256 em repouso no nível da
        aplicação, além dos controles de acesso por tenant no banco.
      </p>
      <div style={{ marginTop: 8 }}>
        <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-block" }}>
          Voltar ao cadastro
        </Link>
      </div>
    </LegalPageShell>
  );
}
