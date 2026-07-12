import { CronogramaContent } from "./cronograma-content";
import { getCurrentTenantFeatureAccess } from "@/lib/billing/server-feature-gate";
import { PremiumFeatureBlock } from "@/components/organisms/premium-feature-block";

type CronogramaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function CronogramaPage({ searchParams }: CronogramaPageProps) {
  const { access } = await getCurrentTenantFeatureAccess("cronograma");
  if (access.level !== "allowed") {
    return <PremiumFeatureBlock featureName="Cronograma" status={access} />;
  }

  const params = searchParams ? await searchParams : {};
  const obraId = firstParam(params.obra_id);
  const status = firstParam(params.status);
  const dateFrom = firstParam(params.date_from);
  const dateTo = firstParam(params.date_to);
  const page = firstParam(params.page);
  const view = firstParam(params.view) || "visao";
  const ok = firstParam(params.ok);

  return (
    <CronogramaContent
      obraId={obraId}
      status={status}
      dateFrom={dateFrom}
      dateTo={dateTo}
      page={page}
      view={view}
      ok={ok}
    />
  );
}
