import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { CronogramaContent } from "./cronograma-content";

export default async function CronogramaPage() {
  return (
    <FeatureGateWrapper feature="cronograma">
      <CronogramaContent />
    </FeatureGateWrapper>
  );
}
