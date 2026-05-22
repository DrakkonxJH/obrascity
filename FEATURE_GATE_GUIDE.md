# Feature Gate Integration Guide

## O que é Feature Gate?

O **Feature Gate** é um sistema de bloqueio de acesso que protege recursos premium. Quando um usuário tenta acessar uma feature fora do seu plano, um modal aparece pedindo para fazer upgrade.

## Como Usar

### Para Server Components (Páginas)

```tsx
import { FeatureGateWrapper } from "@/components/feature-gate-wrapper";
import { YourContent } from "./your-content";

export default async function YourPage() {
  return (
    <FeatureGateWrapper feature="cronograma">
      <YourContent />
    </FeatureGateWrapper>
  );
}
```

### Para Client Components

```tsx
"use client";

import { FeatureGate } from "@/components/feature-gate";
import { useEffect, useState } from "react";
import { SubscriptionSnapshot } from "@/lib/billing/plans";
import { getSubscriptionForCurrentTenant } from "@/lib/billing/subscription";

export function YourComponent() {
  const [subscription, setSubscription] = useState<SubscriptionSnapshot | null>(null);

  useEffect(() => {
    getSubscriptionForCurrentTenant().then(setSubscription);
  }, []);

  return (
    <FeatureGate feature="integracao_whatsapp" subscription={subscription}>
      {/* Seu conteúdo aqui */}
    </FeatureGate>
  );
}
```

### Para Usar o Hook Diretamente

```tsx
"use client";

import { useFeatureAccess } from "@/lib/billing/use-feature-access";
import { SubscriptionSnapshot } from "@/lib/billing/plans";

export function MyFeature({ subscription }: { subscription: SubscriptionSnapshot | null }) {
  const { hasAccess, status, showUpgradeModal, setShowUpgradeModal } = 
    useFeatureAccess(subscription, "relatorios_agendados");

  if (!hasAccess) {
    return <div>Você não tem acesso a este recurso</div>;
  }

  return <div>Seu conteúdo premium aqui</div>;
}
```

## Mapa de Features e Planos

| Feature | Trial | Starter | Pro | Enterprise |
|---------|-------|---------|-----|------------|
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Obras Básicas | ✓ | ✓ | ✓ | ✓ |
| Equipes Básicas | ✓ | ✓ | ✓ | ✓ |
| Materiais Básicos | ✓ | ✓ | ✓ | ✓ |
| **Cronograma** |  |  | ✓ | ✓ |
| **Relatórios Avançados** |  |  | ✓ | ✓ |
| **Notificações** |  |  | ✓ | ✓ |
| **Controle de Acesso Avançado** |  |  | ✓ | ✓ |
| **Financeiro Avançado** |  |  |  | ✓ |
| **Integrações** |  |  |  | ✓ |
| **Automações** |  |  |  | ✓ |
| **Segurança Enterprise** |  |  |  | ✓ |
| **API Access** |  |  |  | ✓ |

## Features que Precisam de Bloqueio

### Pro Plan (bloquear em Starter/Trial)
- `cronograma` - /cronograma
- `relatorios_export` - /relatorios/[tipo]
- `relatorios_agendados` - /relatorios (formulário de agendamento)
- `notificacoes_alertas` - /configuracoes (seção de notificações)
- `controle_acesso_avancado` - /equipes (funções avançadas)

### Enterprise Plan (bloquear em Starter/Pro/Trial)
- `financeiro_avancado` - /financeiro (análise completa)
- `integracao_whatsapp` - /configuracoes/integraciones
- `integracao_sheets` - /configuracoes/integraciones
- `integracao_zapier` - /configuracoes/integraciones
- `automacoes_workflow` - /configuracoes/automacoes
- `gestao_documentos` - /portal
- `comunicacao_integrada` - /portal/chat
- `seguranca_enterprise` - /configuracoes/seguranca
- `api_access` - /configuracoes/api

## Implementação de Exemplo (Cronograma)

**Antes:**
```tsx
export default async function CronogramaPage() {
  const [items, obras] = await Promise.all([...]);
  return <section>{/* conteúdo */}</section>;
}
```

**Depois:**
```tsx
// page.tsx
export default async function CronogramaPage() {
  return (
    <FeatureGateWrapper feature="cronograma">
      <CronogramaContent />
    </FeatureGateWrapper>
  );
}

// cronograma-content.tsx
export async function CronogramaContent() {
  const [items, obras] = await Promise.all([...]);
  return <section>{/* conteúdo */}</section>;
}
```

## Fallback UI Customizado

Se quiser mostrar um UI customizado quando o usuário não tem acesso:

```tsx
<FeatureGateWrapper 
  feature="cronograma"
  fallbackUI={
    <div style={{ padding: 32, textAlign: "center" }}>
      <p>Cronograma disponível apenas no plano Pro</p>
    </div>
  }
>
  <CronogramaContent />
</FeatureGateWrapper>
```

## Testando o Feature Gate

1. **Criar uma conta de teste com plano Trial**
2. **Acessar /cronograma** → deve mostrar bloqueio
3. **Acessar /planos** → deve mostrar opção de upgrade
4. **Fazer upgrade para Pro**
5. **Acessar /cronograma novamente** → deve funcionar normalmente

## Próximos Passos

As seguintes páginas ainda precisam de integração:
- [ ] /relatorios - bloquear relatórios avançados
- [ ] /financeiro - bloquear análise financeira
- [ ] /configuracoes - bloquear seções premium
- [ ] /equipes - bloquear funções avançadas
- [ ] /portal - bloquear gestão de documentos e chat
