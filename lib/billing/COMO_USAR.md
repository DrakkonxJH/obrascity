# 📚 Como Usar as Features Agrupadas

## Quick Start

### 1️⃣ Importar todas as features agrupadas

```typescript
import { featuresAgrupadas, type CategoriaFeature } from '@/lib/billing/features-agrupadas';

// featuresAgrupadas é um objeto com 7 categorias
// operacional | relatorios | comunicacao | integracao | automacao | seguranca | api
```

### 2️⃣ Acessar features por categoria

```typescript
// Pegar todas as features de uma categoria
const featuresOperacional = featuresAgrupadas.operacional;
// [{id: 'dashboard', nome: '...', tiers: ['pro', 'enterprise'], ...}, ...]

// Pegar todas as integrações
const integracoes = featuresAgrupadas.integracao;
```

### 3️⃣ Filtrar por tier

```typescript
const featuresProTodas = Object.values(featuresAgrupadas)
  .flat()
  .filter(f => f.tiers.includes('pro'));
```

### 4️⃣ Usar na página de planos

```typescript
import { featuresAgrupadas, type CategoriaFeature } from '@/lib/billing/features-agrupadas';

export default function PlanosPage() {
  return (
    <>
      {Object.entries(featuresAgrupadas).map(([categoria, features]) => (
        <section key={categoria}>
          <h3>{categoriasLabels[categoria]}</h3>
          {features.map(feature => (
            <FeatureItem key={feature.id} feature={feature} />
          ))}
        </section>
      ))}
    </>
  );
}
```

## Estrutura de Dados

### FeatureAgrupada

```typescript
interface FeatureAgrupada {
  id: string;                           // "dashboard"
  nome: string;                        // "Dashboard Customizável"
  descricao: string;                   // "Widgets personalizáveis..."
  categoria: CategoriaFeature;         // "operacional"
  tiers: TierPlano[];                  // ["pro", "enterprise"]
  modulo: string;                      // "lib/dashboard/customizacao"
}
```

### TierPlano

```typescript
type TierPlano = "starter" | "pro" | "enterprise";
```

### CategoriaFeature

```typescript
type CategoriaFeature = 
  | "operacional"
  | "relatorios"
  | "comunicacao"
  | "integracao"
  | "automacao"
  | "seguranca"
  | "api";
```

## Exemplos Práticos

### Verificar se feature está no plano

```typescript
const dashboard = featuresAgrupadas.operacional[0];

if (dashboard.tiers.includes('pro')) {
  // Feature está disponível no plano Pro
}
```

### Contar features por tier

```typescript
import { resumoFeatures } from '@/lib/billing/features-agrupadas';

console.log(resumoFeatures.pro);        // 7
console.log(resumoFeatures.enterprise);  // 16
console.log(resumoFeatures.total);       // 14
```

### Renderizar tabela comparativa

```typescript
const planos = ['starter', 'pro', 'enterprise'];

Object.entries(featuresAgrupadas).map(([categoria, features]) => (
  <table key={categoria}>
    <thead>
      <tr>
        <th>Feature</th>
        {planos.map(plano => <th key={plano}>{plano}</th>)}
      </tr>
    </thead>
    <tbody>
      {features.map(feature => (
        <tr key={feature.id}>
          <td>{feature.nome}</td>
          {planos.map(plano => (
            <td key={plano}>
              {feature.tiers.includes(plano) ? '✓' : '—'}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
));
```

## Arquivos Relacionados

- `lib/billing/features-agrupadas.ts` - MAPA CENTRAL
- `lib/billing/plans.ts` - Definição de planos (legacy)
- `app/(app)/planos/page.tsx` - Página de planos refatorada
- `lib/premium-features/index.ts` - Exports centralizados

## Quando Adicionar Nova Feature

1. Criar arquivo em `lib/categoria/feature.ts`
2. Adicionar `export * from './feature'` em `lib/categoria/index.ts`
3. Adicionar entry em `lib/billing/features-agrupadas.ts`
4. Reexportar em `lib/premium-features/index.ts`

---

**Versão:** 1.0
**Data:** 21/05/2026
**Mantém:** Fácil acesso a todas as features com melhor organização
