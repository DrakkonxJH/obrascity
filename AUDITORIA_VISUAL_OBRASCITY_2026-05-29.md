# Auditoria visual completa - ObrasCitY

Data da auditoria: 2026-05-29, America/Manaus.
Ambiente considerado: producao em `https://obrascity.com.br` e codigo local em `/home/julio-sousa/Documentos/obrasflow/obrascity`.

## Evidencias usadas

- Inventario de rotas em `app/**/page.*`: 48 paginas/telas.
- Navegacao autenticada mapeada em `components/layout/sidebar.tsx`.
- Shell global mapeado em `components/shell/app-shell.tsx`, `components/layout/topbar.tsx`, `components/layout/sidebar.tsx`.
- Design tokens e componentes globais em `app/globals.css` e `app/of-demo-parity.css`.
- Status HTTP em producao:
  - `/`, `/landing.html`, `/login`, `/cadastro`, `/sobre`, `/como-funciona`, `/contato`, `/privacidade`, `/termos`, `/politica-de-cookies`: respondem.
  - `/planos`, `/dashboard`, `/obras`, `/crm`, `/financeiro`, `/contas`: redirecionam para `/login?next=...` quando sem sessao, comportamento esperado.

Limitacao atual: a ferramenta de browser interativo nao esta disponivel neste ambiente. A auditoria abaixo foi feita por leitura estrutural do codigo e validacao HTTP do publicado. A revisao pixel a pixel logada deve ser a proxima etapa antes do deploy visual final.

## Diagnostico executivo

O produto ja tem uma identidade visual forte: fundo escuro, acento laranja, linguagem operacional e boa cobertura de modulos. O problema principal nao e falta de tela; e consistencia, acabamento e clareza comercial. Existem telas muito densas, uso misto de emojis e Lucide, muitos estilos inline, tabelas com risco de overflow, copy com acentos inconsistentes e diferenca grande entre a landing/publico e o app autenticado.

Para vender, o site precisa parecer menos "protótipo funcional completo" e mais "SaaS pronto para cliente pagar". A prioridade deve ser: padronizar shell e componentes globais, melhorar a pagina de planos, polir onboarding/login/cadastro e reduzir ruido visual dos modulos operacionais.

## Problemas globais prioritarios

| Prioridade | Area | Problema | Impacto | Acao recomendada |
| --- | --- | --- | --- | --- |
| Alta | App inteiro | Uso misto de emojis no topbar, cards, KPIs e CRM, apesar de haver `lucide-react` instalado | Aparencia menos profissional em produto B2B pago | Trocar emojis de UI por Lucide no shell e nos modulos principais |
| Alta | App inteiro | Muitos estilos inline por pagina | Inconsistencia visual, manutencao lenta e risco de regressao por tela | Criar componentes/tokens reutilizaveis: `PageHeader`, `KpiCard`, `DataTable`, `ActionBar`, `StatusBadge` |
| Alta | Tabelas | Tabelas densas em financeiro, contas, relatorios, qualidade e materiais dependem de scroll horizontal | Uso ruim em notebook e celular; decisores podem abandonar fluxo | Padronizar tabela com header fixo, densidade compacta, colunas prioritarias e cards responsivos em mobile |
| Alta | Comercial | `/planos` mistura status da assinatura, base comum, separacao comercial, oferta e cards de preco na mesma hierarquia | Conversao fraca; o usuario nao entende rapido o plano certo | Refazer planos como pagina de decisao: plano atual, recomendacao, ciclo mensal/anual, comparativo limpo e CTA dominante |
| Alta | Publico x app | Landing em `public/landing.html` e app em Next usam estilos e fontes proximos, mas nao o mesmo sistema | Marca parece dividida entre marketing e produto | Migrar landing para componentes Next ou alinhar tokens e header/footer |
| Media | Textos | Varias strings sem acento ou com termos tecnicos misturados: "Voce", "Exportacao", "Notificacoes", "AP/AR" | Percepcao de acabamento menor | Revisao de microcopy pt-BR, mantendo termos tecnicos onde fazem sentido |
| Media | Mobile | Shell e tabelas tem media queries, mas modulos com grids/forms longos podem ficar cansativos no celular | Campo/obra precisa mobile forte | Criar modo mobile por modulo: cards resumidos, filtros colapsaveis e acoes prioritarias |
| Media | Acessibilidade | Botoes com simbolos textuais (`+`, setas, emojis) e estilos inline podem perder labels/focus consistentes | Risco de usabilidade e qualidade | Padronizar botoes com icone Lucide + aria-label + foco visivel |
| Media | Empty states | Existem mensagens vazias, mas varias telas nao guiam para a primeira acao | Onboarding fraco para primeiro cliente | Empty states orientados por modulo, com CTA direto |

## Auditoria por paginas publicas

| Rota | Estado visual | Melhorias recomendadas |
| --- | --- | --- |
| `/` e `/landing.html` | Landing completa, visual forte, dark/fire, hero com mockup | Reduzir exagero visual em secoes longas, garantir print real do produto, alinhar CTA com `/cadastro` e `/planos`, revisar responsividade do hero |
| `/login` | Tela mais polida que o app antigo, boa identidade | Trocar SVG manual do olho por Lucide, reduzir headline se o foco for login rapido, melhorar mensagem de erro e estado carregando |
| `/cadastro` | Fluxo critico para venda | Deve virar onboarding comercial: passos claros, beneficios curtos, seguranca, campo empresa/cargo bem hierarquizado |
| `/recuperar-senha` e `/redefinir-senha` | Funcionais | Padronizar com login v2 e melhorar mensagens de sucesso/erro |
| `/master-login` | Redireciona para login sem sessao | Confirmar se deve existir tela propria ou remover rota publica para nao parecer quebrado |
| `/sobre` | Institucional | Alinhar visual com landing; incluir prova de produto e foco em construtoras |
| `/como-funciona` | Educacional/comercial | Transformar em fluxo visual de 3 a 5 passos com prints reais do produto |
| `/contato` | Conversao | Dar mais destaque a demo/vendas, WhatsApp/e-mail e expectativa de resposta |
| `/privacidade`, `/termos`, `/politica-de-cookies` | Legal | Boa necessidade operacional; polir leitura com sumario lateral em desktop |
| `/maintenance` | Operacional | Garantir visual simples e confiavel, sem parecer erro generico |
| `/portal-public/[token]` | Portal externo | Visual deve ser mais claro e menos denso, pois e usado por cliente externo que nao conhece o app |

## Auditoria do shell autenticado

| Area | Observacao | Acao |
| --- | --- | --- |
| Sidebar | Boa cobertura de modulos, mas muitos itens competem visualmente | Agrupar por jornada: Operacao, Controle, Comercial, Sistema; destacar 5 rotas mais usadas |
| Topbar | Usa emojis por rota e botao `+ Nova Obra` | Trocar por Lucide, incluir breadcrumb curto e contexto da empresa/plano |
| Notificacoes | Painel existe | Melhorar severidade visual, agrupar por obra/modulo, estados vazio/carregando |
| Detail panel | Permite leitura rapida | Padronizar layout de detalhes com secoes, acoes e links profundos |
| Modais | Nova obra/add member existem | Padronizar largura, labels, validacao visual e botoes primario/secundario |

## Auditoria por paginas autenticadas principais

| Rota | Diagnostico visual | Melhorias recomendadas |
| --- | --- | --- |
| `/dashboard` | Bom resumo inicial, mas KPIs e alertas usam emojis e alguns textos artificiais como "across" | Deixar executivo: saude da operacao, obra critica, caixa, atrasos; trocar graficos fake por dados reais ou esconder |
| `/obras` | Cards bons para scan, filtros simples | Adicionar visual de etapa, responsavel, prazo e risco; criar tabela/lista alternativa para operacao densa |
| `/obras/[id]` | Detalhe essencial | Precisa virar cockpit da obra: cabecalho forte, abas de cronograma/financeiro/materiais/diario/documentos |
| `/cronograma` | Forms e tabelas densos | Criar toolbar, modo Gantt/tabela, filtros por obra/status, cards mobile |
| `/viabilidade` | Tela muito completa, mas excessivamente longa | Dividir em abas: Resumo, Dados fisicos, Financeiro, Tecnico, Legal, Riscos; fixar GO/NO-GO no topo |
| `/crm` | Interface propria estilo Kanban, muito rica, mas destoante do resto | Unificar tokens, remover fonte IBM nao importada, revisar mobile, simplificar workspaces/tabs e padronizar modais |
| `/projetos` | Utilitario, depende de forms/tabelas | Melhorar hierarquia entre documentos, conflitos e acoes; cards para conflitos abertos |
| `/financeiro` | Completo, com KPIs, tabelas, charts e forms | Reduzir densidade inicial: primeiro caixa/risco, depois lancamentos; melhorar AP/AR e medicoes com tabs |
| `/equipes` | Cards/listagem de equipe | Melhorar leitura de cargos, disponibilidade, alocacao por obra e convite |
| `/materiais` | Tem estoque, pedidos, cotacoes e fornecedores | Separar estoque, pedidos e cotacoes em tabs; reduzir formulario inicial; destacar criticos |
| `/mudancas` | Fluxo critico de controle | Precisa destacar impacto em prazo/custo/status e aprovacoes pendentes |
| `/diario` | Campo/registro | Melhorar para uso mobile, anexos/evidencias e timeline por data |
| `/qualidade` | Muito completo e denso | Dividir RNC, CAPA, Evidencias e Inspecoes; melhorar severidade/status visual |
| `/entrega` | Fluxo final da obra | Destacar checklist, pendencias, aceite e documentos de entrega |
| `/garantia` | Pos-entrega | Visual de chamados, SLA, origem e status por cliente |
| `/relatorios` | Solicitar/consultar relatorios | Melhorar pagina como central: templates, agendados, recentes, filtros e status de fila |
| `/relatorios/[tipo]` | Varias renderizacoes por tipo | Padronizar cabecalho, cards e tabelas por relatorio; melhorar impressao/exportacao |

## Auditoria de sistema e suporte

| Rota | Diagnostico visual | Melhorias recomendadas |
| --- | --- | --- |
| `/planos` | Pagina comercial mais critica dentro do app; hoje esta informativa demais | Redesenhar como comparador de compra: recomendacao, economia anual, plano atual, CTA, gateway e FAQ curto |
| `/planos/pix-asaas` | Fluxo PIX | Precisa de tela clara de pagamento pendente, QR/copia e cola, tempo de expiracao e suporte |
| `/portal` | Configuracao e compartilhamento | Separar configuracao, links ativos e atividade; usar preview do portal |
| `/suporte` | Guia e canais | Melhorar busca, categorias e CTA de abertura de chamado |
| `/suporte/guia` | Biblioteca | Usar cards mais escaneaveis por modulo e nivel de prioridade |
| `/suporte/guia/[slug]` | Conteudo longo | Adicionar sumario lateral, progresso e secoes colapsaveis |
| `/governanca` | Auditoria/governanca | Precisa visual mais executivo: trilhas, retencao, riscos, eventos recentes |
| `/seguranca-corporativa` | Controles enterprise | Tornar mais confiavel: sessoes, MFA, SSO, politicas, alertas |
| `/mobile-campo` | Promessa de campo | Deve parecer produto mobile real: cards de uso em obra, screenshots/preview e fluxos offline |
| `/configuracoes` | Ajustes gerais | Separar perfil, empresa, notificacoes, integracoes e seguranca por tabs |

## Auditoria do console master `/contas`

Abas encontradas: Empresas, Usuarios, Faturamento, IA de operacoes, Seguranca, Suporte, Auditoria, Runbooks, Acesso assistido, Limites e quotas, Feature flags, Comunicacao, Health, Terminal, Integracoes, Deploy.

| Aba | Problema visual | Acao |
| --- | --- | --- |
| Empresas | Tabela muito larga e acoes demais na mesma linha | Criar coluna de menu de acoes, filtros no topo e resumo por status |
| Usuarios | Edicao inline densa | Usar painel lateral para editar usuario e resetar senha |
| Faturamento | KPIs bons, mas sem funil/receita visual | Adicionar MRR, trials, vencimentos e risco de churn |
| IA de operacoes | Precisa parecer ferramenta confiavel | Separar assistente, checks e recomendacoes; logs com severidade |
| Seguranca | Alertas precisam mais hierarquia | Cards por severidade, status e prazo de resolucao |
| Suporte | Formulario e fila competem na mesma tela | Criar tabs ou split: abrir ticket vs fila |
| Auditoria | Tabela funcional | Adicionar filtros salvos, destaque de acoes sensiveis e detalhe expandido |
| Runbooks | Conteudo simples | Transformar em cards acionaveis com checklist operacional |
| Acesso assistido | Fluxo sensivel | Reforcar aviso, escopo, expiracao e auditoria antes de iniciar |
| Limites e quotas | Operacional | Usar matriz por empresa/plano, com campos compactos |
| Feature flags | Produto | Mostrar impacto, ambiente, status e historico de alteracao |
| Comunicacao | Tenant broadcast | Preview da mensagem e segmentacao clara |
| Health | Operacao | Visual de semaforo por servico e historico curto |
| Terminal | Alto risco | Visual distinto, modo somente leitura quando possivel e confirmacoes fortes |
| Integracoes | Hoje lista status simples | Separar configurado/pendente, CTA de configurar e impacto comercial |
| Deploy | Informativo | Mostrar dominio, ultima implantacao, ambiente e checklist de go-live |

## Ordem recomendada de execucao antes das vendas

1. Padronizar shell e componentes globais: sidebar, topbar, botoes, badges, inputs, tabelas e cards.
2. Refazer `/planos`, `/login`, `/cadastro` e landing para conversao e confianca comercial.
3. Polir os 5 modulos mais vistos em demo: Dashboard, Obras, Financeiro, Cronograma, Materiais.
4. Ajustar CRM, Portal do Cliente e Relatorios, porque pesam muito na percepcao de produto completo.
5. Melhorar console master depois que a frente comercial estiver pronta, mantendo foco em operacao interna.

## Backlog visual imediato

- Criar componente `PageHeader` com titulo, subtitulo, acoes e breadcrumbs.
- Criar `DataTable` responsiva com scroll controlado, densidade compacta e fallback mobile.
- Substituir emojis de navegacao/KPIs por Lucide nos pontos de produto.
- Revisar todos os textos sem acento e microcopy comercial.
- Transformar formularios longos em secoes/tabs com primeiro CTA claro.
- Criar estados vazio/carregando/erro padronizados por modulo.
- Melhorar `/planos` como tela de venda dentro do app.
- Validar visual em desktop 1440px, notebook 1366px, tablet e mobile antes de deploy.

## Conclusao

O ObrasCitY esta funcionalmente amplo, mas o visual ainda precisa de uma camada de acabamento de produto SaaS vendido: menos ruido, mais padrao, mais clareza de decisao e uma experiencia comercial forte. A primeira frente deve ser global, porque muitos problemas se repetem em quase todas as paginas.

## Acompanhamento de execucao

### 2026-05-29 18:26:51 -04 (America/Manaus) - Bloco 1 concluido

Status: concluido.

Mudancas aplicadas:
- `components/layout/topbar.tsx`
  - substituicao de emojis por `lucide-react` na navegacao de pagina;
  - botao de notificacao com icone `Bell`;
  - CTA `Nova Obra` com icone `Plus`;
  - mapeamento de pagina com `LucideIcon` para padronizar linguagem visual do shell.
- `app/globals.css`
  - ajuste da topbar para comportar icones de forma consistente;
  - padronizacao de alinhamento em `of-btn-primary` e `of-btn-icon`;
  - inclusao de classes base do design system v1:
    - `of-page-head`
    - `of-page-head-main`
    - `of-page-head-actions`
    - `of-page-eyebrow`
    - `of-page-subtitle`

Impacto visual esperado deste bloco:
- shell mais profissional e coerente com SaaS B2B;
- reducao imediata da sensacao de UI "mista" (emoji + componentes);
- base pronta para migrar cabecalhos de modulo sem retrabalho.

Proximo bloco planejado:
- aplicar `of-page-head` e `of-page-subtitle` nas paginas de maior impacto comercial:
  1. `/planos`
  2. `/dashboard`
  3. `/obras`
  4. `/financeiro`

### 2026-05-29 18:51:51 -04 (America/Manaus) - Bloco 2 concluido

Status: concluido.

Mudancas aplicadas:
- `components/dashboard/dashboard-view.tsx`
  - inclusao de cabecalho padrao `of-page-head` com contexto operacional.
- `components/obras/obras-view.tsx`
  - inclusao de cabecalho padrao `of-page-head` com foco em execucao.
- `app/(app)/planos/page.tsx`
  - troca de `of-inline-header` por `of-page-head` padronizado.
- `app/(app)/financeiro/page.tsx`
  - inclusao de `of-page-head` antes dos blocos de metricas e tabelas.

Impacto visual esperado deste bloco:
- hierarquia de pagina mais clara nas telas mais demonstradas em venda;
- consistencia de linguagem visual entre modulos centrais;
- base pronta para extrair componente reutilizavel `PageHeader` no proximo ciclo.

Proximo bloco planejado:
1. normalizar tabelas densas (`DataTable`) em `financeiro`, `materiais`, `qualidade`, `contas`.
2. substituir emojis restantes de UI em `dashboard`, `obras`, `crm` e cards de KPI.
3. iniciar redesenho comercial de `/planos` com foco em decisao de compra.

### 2026-05-29 18:57:32 -04 (America/Manaus) - Bloco 3 concluido

Status: concluido.

Mudancas aplicadas:
- `app/globals.css`
  - adicao de variantes de tabela para densidade e padrao unico:
    - `of-table-wrap--flat`
    - `of-table-wrap--dense`
    - `of-table--dense`
  - cabecalho de tabela com comportamento sticky para leitura em listas longas.
- `app/(app)/financeiro/page.tsx`
  - migracao dos wrappers/tabelas para padrao denso unificado.
- `app/(app)/materiais/page.tsx`
  - migracao dos wrappers/tabelas para padrao denso unificado.
- `app/(app)/qualidade/page.tsx`
  - migracao dos wrappers/tabelas para padrao denso unificado.
- `app/(app)/contas/page.tsx`
  - migracao das tabelas e wrappers do console master para padrao `of-table` unificado.

Impacto visual esperado deste bloco:
- maior consistencia visual entre modulos com alta densidade de dados;
- leitura mais rapida em tabelas operacionais;
- reducao de divergencia entre telas de operacao e console master.

Proximo bloco planejado:
1. remover emojis de interface restantes em `dashboard`, `obras` e `crm`, mantendo somente iconografia padrao.
2. consolidar `PageHeader` como componente reutilizavel (extraindo markup repetido).
3. iniciar redesenho comercial de `/planos` para conversao (comparativo limpo e CTA dominante).

### 2026-05-29 19:01:41 -04 (America/Manaus) - Bloco 4 concluido

Status: concluido.

Mudancas aplicadas:
- `components/dashboard/dashboard-view.tsx`
  - remocao de emojis em cards KPI e alertas;
  - substituicao por iconografia `lucide-react` (HardHat, Hourglass, Users, CheckCircle2, AlertTriangle, BellDot, TrendingUp, Briefcase).
- `components/obras/obras-view.tsx`
  - substituicao do icone de busca por `Search` (lucide).
- `app/(app)/crm/page.jsx`
  - remocao de simbolos emoji em atividades e dados de contato;
  - padronizacao dos indicadores de tipo de atividade com labels textuais curtas (`FUP`, `TEL`, `MAIL`, `MEET`, `PROP`, `NOTE`, `TASK`);
  - padronizacao de exibicao de contato para `Email:` e `Telefone:`.

Impacto visual esperado deste bloco:
- interface mais corporativa e consistente com produto SaaS B2B;
- menor sensacao de prototipo visual;
- uniformidade de linguagem entre modulos principais.

Proximo bloco planejado:
1. consolidar `PageHeader` em componente reutilizavel para reduzir repeticao e divergencia visual.
2. redesenhar `/planos` com foco comercial de conversao (comparativo, recomendacao, CTA e friccao minima).
3. revisar microcopy nas paginas comerciais/publicas (`/cadastro`, `/login`, `/contato`, `/como-funciona`).

### 2026-05-29 19:06:10 -04 (America/Manaus) - Bloco 5 concluido

Status: concluido.

Mudancas aplicadas:
- `components/ui/page-header.tsx`
  - criacao de componente reutilizavel `PageHeader` para padronizar cabecalho de pagina (eyebrow, titulo, subtitulo e acoes).
- `components/dashboard/dashboard-view.tsx`
  - migracao do cabecalho para `PageHeader`.
- `components/obras/obras-view.tsx`
  - migracao do cabecalho para `PageHeader`.
- `app/(app)/financeiro/page.tsx`
  - migracao do cabecalho para `PageHeader`.
- `app/(app)/planos/page.tsx`
  - migracao do cabecalho para `PageHeader`;
  - adicao de painel superior comercial com:
    - status rapido de plano e assinatura;
    - seletor mensal/anual no topo;
    - atalho para portal de cobranca (Stripe) quando permitido;
  - limpeza de rotulos com emoji em meios de pagamento para linguagem corporativa.

Impacto visual esperado deste bloco:
- consistencia estrutural de cabecalho entre modulos centrais;
- reducao de repeticao visual e tecnica nas paginas principais;
- melhoria de clareza comercial imediata na pagina `/planos`.

Proximo bloco planejado:
1. polimento final de microcopy e estados em telas publicas/comerciais (`/login`, `/cadastro`, `/contato`, `/como-funciona`).
2. revisao responsiva final (desktop/notebook/tablet/mobile) nas telas de venda e operacao.
3. fechamento da auditoria com checklist de go-live visual e pontos pendentes de baixa prioridade.

### 2026-05-29 19:10:30 -04 (America/Manaus) - Bloco 6 concluido

Status: concluido.

Mudancas aplicadas:
- `app/(auth)/login/page.tsx`
  - substituicao do simbolo visual da marca por iconografia `HardHat` (lucide).
- `app/(auth)/cadastro/page.tsx`
  - substituicao do simbolo visual da marca por iconografia `HardHat` (lucide).
- `app/contato/page.tsx`
  - substituicao de icones emoji por `lucide-react` em nav, cards de contato e CTA;
  - ajuste de microcopy comercial para tom mais corporativo e consistente.
- `app/como-funciona/page.tsx`
  - substituicao de elementos emoji no header/footer por iconografia padrao;
  - padronizacao de CTAs e badges de confianca sem simbolos informais.
- `components/dashboard/dashboard-view.tsx`
  - ajuste de microcopy residual em ingles (`across` -> texto em portugues padronizado).

Validacao tecnica:
- typecheck executado com sucesso apos as alteracoes.

Impacto visual esperado deste bloco:
- consistencia de linguagem visual entre area publica e area autenticada;
- reducao de ruido informal em pontos de conversao;
- acabamento final mais coerente para inicio de vendas.

## Checklist go-live visual

- [x] Shell visual padronizado (`sidebar`, `topbar`, botoes e icones base).
- [x] Cabecalhos de modulos principais padronizados (`PageHeader`).
- [x] Tabelas densas unificadas em modulos operacionais criticos.
- [x] Remocao de emojis de interface nos fluxos centrais.
- [x] Pagina de planos com cabecalho comercial e acoes de cobranca visiveis.
- [x] Polimento de microcopy nas paginas comerciais priorizadas.
- [ ] Revisao visual manual final em viewport real (desktop/notebook/tablet/mobile) com captura de tela por rota.
- [ ] Ajustes finos de contraste e espacamento apos revisao manual.

Pendencias de baixa prioridade apos go-live:
- reduzir estilo inline remanescente em paginas antigas, migrando gradualmente para componentes/tokens;
- evoluir CRM para mesmo nivel de linguagem visual dos demais modulos;
- revisar copy de apoio institucional para SEO/comercial com foco em conversao.

### 2026-05-29 19:39:43 -04 (America/Manaus) - Bloco 7 concluido

Status: concluido.

Mudancas aplicadas:
- `app/globals.css`
  - reforco visual global para diferenca perceptivel imediata nos modulos alterados:
    - `of-page-head` com bloco destacado (gradiente, borda e profundidade);
    - `of-card` com camada de luz laranja sutil, elevacao e hover mais evidente;
    - `of-obra-card` com contraste superior e destaque de borda no hover;
    - `of-table-wrap` e `thead` com acabamento mais forte para leitura operacional;
    - hover de linhas de tabela mais perceptivel.
- `app/(app)/materiais/page.tsx`
  - migracao de header manual para `PageHeader` com acoes no topo (importacao + pedido de compra);
  - padronizacao com os demais modulos centrais.
- `app/(app)/qualidade/page.tsx`
  - migracao de header manual para `PageHeader` com titulo/subtitulo padronizados.
- `components/obras/obras-view.tsx`
  - adicao de grade de KPIs no topo da pagina (`Obras ativas`, `Em andamento`, `Concluidas`, `Lixeira`) para impacto visual direto na rota `/obras`.

Validacao tecnica:
- typecheck executado com sucesso apos as alteracoes.

Impacto visual esperado deste bloco:
- diferenca visivel sem alterar identidade do produto;
- maior hierarquia de informacao no topo das paginas;
- percepcao de produto mais maduro em modulos operacionais criticos.

### 2026-05-29 20:18:26 -04 (America/Manaus) - Reauditoria e Bloco 8 concluido

Status: concluido.

Escopo reavaliado:
- backlog visual imediato da auditoria original;
- rotas com `of-inline-header` remanescente;
- emojis/simbolos informais em paginas autenticadas e componentes centrais;
- comportamento basico de rotas no servidor local.

Mudancas aplicadas:
- `app/globals.css`
  - ajuste responsivo global em `PageHeader`;
  - scroll horizontal consistente para tabelas em telas estreitas;
  - largura minima de tabela para evitar quebra visual em colunas densas.
- `app/(app)/obras/[id]/page.tsx`, `app/(app)/relatorios/page.tsx`, `app/(app)/relatorios/[tipo]/page.tsx`, `app/(app)/suporte/page.tsx`, `app/(app)/suporte/guia/page.tsx`, `app/(app)/suporte/guia/[slug]/page.tsx`, `app/(app)/viabilidade/page.tsx`, `app/(app)/contas/page.tsx`, `components/equipes/equipes-view.tsx`
  - migracao dos cabecalhos manuais restantes para `PageHeader`;
  - reducao de divergencia visual entre modulos.
- `app/(app)/relatorios/page.tsx`, `app/(app)/contas/page.tsx`, `components/layout/auth-header.tsx`, `components/materiais/purchase-order-modal.tsx`
  - substituicao de emojis/simbolos informais por `lucide-react` ou texto corporativo.
- `app/(app)/viabilidade/page.tsx`, `app/(app)/viabilidade/risk-matrix.tsx`, `app/(app)/planos/page-table.tsx`, `app/(app)/suporte/guia/data.ts`, `components/config/config-view.tsx`, `components/feature-gate-wrapper.tsx`
  - limpeza de emojis em titulos, badges, guias e estados operacionais.
- `app/(app)/*/error.tsx`
  - padronizacao visual das telas de erro sem emoji grande.
- `app/(app)/cronograma/cronograma-content.tsx`, `app/(app)/materiais/page.tsx`, `app/(app)/qualidade/page.tsx`, `app/(app)/crm/page.jsx`, `components/obras/obras-view.tsx`
  - limpeza de sinais textuais de prototipo em botoes/links (`+`, seta textual, "Painel ->").

Evidencias de validacao:
- `npm run typecheck`: executado com sucesso.
- servidor local iniciado em `http://127.0.0.1:3000`.
- `agent-browser`: indisponivel neste ambiente (`command not found`), portanto nao houve captura automatizada de screenshot.
- checagem HTTP local:
  - `/`: `307` para `/landing.html`;
  - `/login`: `200`;
  - `/cadastro`: `200`;
  - `/como-funciona`: `200`;
  - `/contato`: `200`;
  - `/planos`, `/obras`, `/relatorios`, `/suporte`, `/viabilidade`: `307` para `/login`, esperado sem sessao autenticada local.
- busca estrutural:
  - `of-inline-header` em paginas/componentes: 0 usos remanescentes fora da definicao CSS.
  - emojis nas paginas autenticadas e componentes centrais auditados: 0 ocorrencias remanescentes pelo filtro aplicado.

Checklist atualizado:
- [x] Shell visual padronizado (`sidebar`, `topbar`, botoes e icones base).
- [x] Cabecalhos dos modulos auditados padronizados com `PageHeader`.
- [x] Tabelas densas com base visual unificada e scroll responsivo.
- [x] Remocao de emojis/simbolos informais dos fluxos autenticados centrais.
- [x] Estados de erro autenticados padronizados.
- [x] Auditoria atualizada com evidencias de validacao local.
- [ ] Captura visual logada em producao com usuario real e screenshots por rota.

Pendencia real restante:
- a revisao pixel a pixel logada ainda depende de uma ferramenta de browser disponivel ou de sessao autenticada em producao/local. Sem isso, a validacao feita aqui e estrutural + HTTP + typecheck.
