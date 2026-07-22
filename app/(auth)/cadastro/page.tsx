import type { Metadata } from "next";
import CadastroPageClient from "./cadastro-page-client";

export const metadata: Metadata = {
  title: "Criar conta — ObrasCitY",
};

export default function CadastroPage() {
  return <CadastroPageClient />;
}
