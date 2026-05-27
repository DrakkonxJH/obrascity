# Auditoria Master - Go-Live ObrasCitY

Data: 23/05/2026  
Objetivo: validar o que está realmente pronto na conta master para operação em produção.

Legenda:
- `SIM` = confirmado com evidência.
- `NÃO` = confirmado como faltante/quebrado.
- `NÃO VERIFICADO` = depende de acesso a painel externo ou teste ainda não executado.

## 1) Infra e Deploy

| Item | Status | Evidência | Ação |
|---|---|---|---|
| Repositório com workflow de deploy | SIM | `.github/workflows/deploy-vercel.yml` | Manter branch protection |
| Workflow de monitoramento operacional | SIM | `.github/workflows/ops-monitor.yml` | Ajustar alertas reais |
| Build local (`npm run build`) validado no commit final | NÃO VERIFICADO | Ainda não executado no snapshot final | Rodar build de release |
| Deploy Production ativo na Vercel (último commit) | NÃO VERIFICADO | Exige painel Vercel | Validar SHA + ambiente |
| Variáveis Production completas na Vercel | NÃO VERIFICADO | Exige painel Vercel | Conferir item a item |
| Domínio público da aplicação resolvendo | NÃO VERIFICADO | Exige DNS público do domínio final | Validar `A/CNAME` |

## 2) Banco e Supabase

| Item | Status | Evidência | Ação |
|---|---|---|---|
| Projeto Supabase linkado no CLI | SIM | `supabase link` concluído | Manter |
| Histórico de migration alinhado até `0016` | SIM | `supabase migration list` local=remoto | Manter |
| Estrutura de verificação de e-mail (`0015`) no remoto | SIM | tabela/funções acessíveis | Manter |
| Trial com role `visualizador` (`0016`) | SIM | migration aplicada + lógica de provisionamento | Manter |
| RLS/policies revisadas em todas tabelas sensíveis | NÃO VERIFICADO | Falta auditoria de políticas completa | Rodar revisão SQL |
| Backup e restore testados | NÃO VERIFICADO | Sem evidência de teste de restore | Executar teste real |

## 3) Cadastro, Auth e Onboarding

| Item | Status | Evidência | Ação |
|---|---|---|---|
| Fluxo de cadastro implementado com verificação por e-mail | SIM | `app/(auth)/cadastro/*` + `lib/auth/signup-verification.ts` | Manter |
| Fallback de cadastro protegido para publishable key | SIM | patch em `actions.ts` e `signup-edge-client.ts` | Manter |
| Cadastro ponta a ponta sem erro em produção | NÃO | Bloqueio atual em envio de e-mail (Resend/DNS) | Resolver DNS/Resend |
| Confirmação de usuário novo com role `visualizador` via teste real atual | NÃO VERIFICADO | Teste bloqueado no envio de e-mail | Retestar após Resend OK |
| Limites antiabuso funcionando | SIM | `signup_attempts`/`security_alerts` e evidência anterior de rate limit | Ajustar limites se necessário |

## 4) E-mail transacional (Resend)

| Item | Status | Evidência | Ação |
|---|---|---|---|
| `RESEND_API_KEY` configurada localmente | SIM | `.env.local` | Replicar em Production |
| `RESEND_FROM_EMAIL` configurado | SIM | `.env.local` | Validar remetente final |
| Domínio `obrascity.com` verificado no Resend | NÃO | Painel mostrou `Status: Pendente` | Configurar DNS correto |
| DNS público do domínio existente (NS/A) | NÃO | `dig` sem resposta para `obrascity.com` | Corrigir delegação DNS |
| Envio de e-mail de verificação funcionando | NÃO | Erro 403 domínio não verificado | Resolver domínio |

## 5) Billing (Stripe)

| Item | Status | Evidência | Ação |
|---|---|---|---|
| Integração de checkout implementada | SIM | `lib/billing/stripe-checkout-server.ts` | Manter |
| Webhook Stripe implementado | SIM | `app/api/webhooks/stripe/route.ts` | Manter |
| Chaves e webhook secret válidos em Production | NÃO VERIFICADO | Exige painel/env Vercel | Validar |
| Price IDs corretos para planos | NÃO VERIFICADO | Depende env `STRIPE_PRICE_*_IDS` | Conferir |
| Fluxo real de assinatura testado ponta a ponta | NÃO VERIFICADO | Sem execução comprovada | Executar teste |

## 6) Worker, Redis e filas

| Item | Status | Evidência | Ação |
|---|---|---|---|
| Worker implementado | SIM | `worker/src/index.ts` + processors | Manter |
| Redis configurado localmente | SIM | `.env.local` com `REDIS_URL` | Validar credenciais prod |
| Worker 24/7 em produção | NÃO VERIFICADO | Sem evidência de process manager/serviço | Definir runtime |
| Monitor de filas em produção | NÃO VERIFICADO | Endpoints existem, operação não comprovada | Ligar alertas |

## 7) Segurança, Operação e Suporte

| Item | Status | Evidência | Ação |
|---|---|---|---|
| Validação de input e guardas de segurança | SIM | Zod + `lib/security/*` | Manter |
| Segredos fora do código | PARCIAL | Há variáveis locais; checar master | Revisar painéis |
| 2FA habilitado nas contas administrativas | NÃO VERIFICADO | Exige checagem manual | Habilitar |
| Observabilidade (logs/métricas/alertas) operacional | PARCIAL | health/ops existem, stack externa não comprovada | Fechar monitoramento |
| Runbook de incidente/rollback formal | NÃO | Ainda em construção no guia | Publicar versão final |
| SLA e operação de suporte definidos | NÃO | Não evidenciado | Definir processo |

---

## 8) Score atual de prontidão

- Itens `SIM`: 16  
- Itens `NÃO`: 6  
- Itens `NÃO VERIFICADO`: 16  
- Itens `PARCIAL`: 2

Leitura executiva:
- Núcleo técnico do produto está implementado.
- Bloqueadores atuais de go-live: **DNS/Resend**, validação de **Production envs**, e operação contínua (**worker/monitoramento/backup-restore**).

---

## 9) Sequência de execução imediata (sem pular etapas)

1. Resolver DNS autoritativo do `obrascity.com`.
2. Obter `Verified` no Resend.
3. Reexecutar cadastro com e-mail novo e validar role `visualizador`.
4. Auditar env vars Production na Vercel (Supabase/Redis/Stripe/Resend).
5. Testar Stripe fim a fim (checkout + webhook + sync).
6. Subir worker em processo contínuo e validar filas.
7. Finalizar backup/restore testado e runbook.
