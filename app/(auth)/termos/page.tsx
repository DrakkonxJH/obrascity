import Link from "next/link";
import { LegalPageShell } from "@/components/legal/legal-page-shell";

export default function TermosPage() {
  return (
    <LegalPageShell title="Termos de Uso">
      <p className="of-empty-text">
        Estes termos regem o uso da plataforma ObrasFlow. O uso da plataforma implica aceite das regras de
        segurança, acesso autorizado por usuário e responsabilidade sobre dados inseridos.
      </p>
      <p className="of-empty-text">
        O controlador deve manter dados atualizados, limitar acessos por função e utilizar os recursos da
        plataforma em conformidade com a legislação brasileira aplicável.
      </p>
      <div style={{ marginTop: 8 }}>
        <Link href="/cadastro" className="of-btn-primary" style={{ display: "inline-block" }}>
          Voltar ao cadastro
        </Link>
      </div>
    </LegalPageShell>
  );
}
