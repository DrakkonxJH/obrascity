import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function CadastroPage() {
  return (
    <section className="of-login-v2-layout">
        <div className="of-login-v2-left">
          <p className="of-login-v2-kicker">{"// CRIE SUA CONTA TRIAL EM MINUTOS"}</p>
          <h1 className="of-login-v2-title">
            COMECE
            <br />
            SEU <span>TRIAL</span>
            <br />
            COM TOTAL
            <br />
            CONTROLE
          </h1>
          <p className="of-login-v2-subtitle">
            Cadastro rápido com link único de confirmação por e-mail. 14 dias grátis para validar sua operação na
            prática.
          </p>
        </div>

        <aside className="of-login-v2-card">
          <div className="of-login-v2-brand">
            <span className="of-login-v2-brand-icon">🏗</span>
            <span className="of-login-v2-brand-text">
              OBRAS<span>FLOW</span>
            </span>
          </div>
          <h2 className="of-login-v2-card-title">Criar Conta</h2>
          <p className="of-login-v2-card-subtitle">Ativação de trial gratuita por 14 dias</p>
          <SignupForm />
          <p className="mt-5 text-center text-sm text-[#8896b3]">
            Já tem conta?{" "}
            <Link href="/login" className="text-[#ff9445] hover:underline">
              Fazer login
            </Link>
          </p>
        </aside>
      </section>
  );
}
