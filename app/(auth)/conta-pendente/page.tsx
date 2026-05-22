import Link from "next/link";
import { signOut } from "@/lib/auth/actions";

export default function ContaPendentePage() {
  return (
    <main className="of-login-screen">
      <section className="of-login-wrap" style={{ maxWidth: 520, margin: "0 auto" }}>
        <div className="of-login-left" style={{ width: "100%" }}>
          <h1 className="font-[Syne] text-[1.8rem] font-extrabold">Conta pendente</h1>
          <p className="mt-2 mb-6 text-sm text-[#8896b3]">
            Seu usuário foi autenticado, mas ainda não ha empresa vinculada. Confirme o e-mail enviado
            no cadastro ou aguarde alguns minutos. Se o problema persistir, entre em contato com o
            suporte.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/login" className="of-btn-login text-center">
              Voltar ao login
            </Link>
            <form action={signOut}>
              <button type="submit" className="of-btn-ghost w-full">
                Sair e tentar outro e-mail
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
