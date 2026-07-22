import type { Metadata } from "next";
import RecuperarPageClient from "./recuperar-page-client";

export const metadata: Metadata = {
  title: "Recuperar Senha — ObrasCitY",
};

export default function RecuperarSenhaPage() {
  return <RecuperarPageClient />;
}
