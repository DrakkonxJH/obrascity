import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { CronogramaContent } from "./cronograma-content";

type CronogramaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function CronogramaPage({ searchParams }: CronogramaPageProps) {
  const params = searchParams ? await searchParams : {};
  const obraId = firstParam(params.obra_id);

  return (
    <FeatureGateWrapper feature="cronograma">
      <CronogramaContent obraId={obraId} />
    </FeatureGateWrapper>
  );
}
