import type { Metadata } from "next";
import LoginPageClient from "./login-page-client";

export const metadata: Metadata = {
  title: "Entrar — ObrasCitY",
};

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next ?? "/dashboard";
  return <LoginPageClient nextPath={nextPath} />;
}
