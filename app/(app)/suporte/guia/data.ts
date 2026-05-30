export type GuiaPassoDetalhado = {
  titulo: string;
  objetivo: string;
  explicacao: string;
  acoes: string[];
  validacao: string[];
  falhasComuns: string[];
  imagem: {
    titulo: string;
    legenda: string;
    destaqueVisual: string;
  };
};

export type GuiaFaqItem = {
  pergunta: string;
  resposta: string;
};

export type GuiaItem = {
  slug: string;
  icone: string;
  titulo: string;
  resumo: string;
  paraQueServe: string;
  quandoUsar: string;
  tempoMedioLeitura: string;
  nivel: "inicial" | "intermediario" | "avancado";
  preRequisitos: string[];
  prioridadesOperacionais: string[];
  resultadoEsperado: string;
  passosDetalhados: GuiaPassoDetalhado[];
  boasPraticas: string[];
  errosComuns: string[];
  faq: GuiaFaqItem[];
  rota: string;
};

type GuiaBase = {
  slug: string;
  icone: string;
  titulo: string;
  resumo: string;
  paraQueServe: string;
  quandoUsar: string;
  tempoMedioLeitura: string;
  nivel: "inicial" | "intermediario" | "avancado";
  preRequisitos: string[];
  prioridadesOperacionais: string[];
  resultadoEsperado: string;
  passosBase: string[];
  boasPraticas: string[];
  errosComuns: string[];
  faq: GuiaFaqItem[];
  rota: string;
};

function buildPassoDetalhado(guia: GuiaBase, passo: string, index: number): GuiaPassoDetalhado {
  const numero = index + 1;
  const proximoPasso =
    guia.passosBase[index + 1] ??
    "concluir a revisao final do modulo antes de seguir para a proxima rotina operacional";

  return {
    titulo: `Passo ${numero} - ${passo}`,
    objetivo:
      `Garantir que este passo do modulo ${guia.titulo} seja executado com consistencia, ` +
      "sem lacunas de informação e com rastreabilidade para o time inteiro.",
    explicacao:
      `Neste momento, o foco não e apenas clicar na tela, mas entender o impacto operacional da acao. ` +
      `Ao executar "${passo.toLowerCase()}", voce prepara o ambiente para ${proximoPasso.toLowerCase()}. ` +
      `Se este passo for feito com dados incompletos, os indicadores seguintes podem ficar distorcidos e gerar ` +
      "decisoes erradas. Por isso, trate este bloco como etapa obrigatoria de qualidade do processo.",
    acoes: [
      `Entre no modulo ${guia.titulo} e localize o bloco relacionado a: ${passo.toLowerCase()}.`,
      "Preencha todos os campos obrigatorios com dados reais e consistentes (evite valores aproximados).",
      "Revise filtros, periodo e escopo para confirmar que voce esta atuando na obra/equipe correta.",
      "Salve a alteracao e registre observações curtas para facilitar auditoria e continuidade por outro usuário.",
    ],
    validacao: [
      "A interface confirma o salvamento sem erro e os dados permanecem apos atualizar a tela.",
      "Os indicadores do modulo refletem a alteracao realizada (status, totais, listas ou alertas).",
      "Outro usuário do time consegue abrir a mesma informação e entender o contexto sem explicacao extra.",
    ],
    falhasComuns: [
      "Salvar sem revisar escopo e atualizar dados da obra errada.",
      "Ignorar campos de observacao e perder contexto para auditoria posterior.",
      "Seguir para o proximo passo sem confirmar que o sistema persistiu a alteracao.",
    ],
    imagem: {
      titulo: `Figura ${numero} - Referencia visual do passo`,
      legenda:
        `Use esta referencia para localizar rapidamente onde executar "${passo.toLowerCase()}" ` +
        `dentro do modulo ${guia.titulo}.`,
      destaqueVisual: `${guia.titulo} · etapa ${numero}`,
    },
  };
}

const GUIAS_BASE: GuiaBase[] = [
  {
    slug: "dashboard",
    icone: "DASH",
    titulo: "Dashboard",
    resumo: "Painel central para acompanhar indicadores da operacao em tempo real.",
    paraQueServe:
      "Concentrar a visao executiva da empresa: andamento de obras, alertas e pontos de atencao.",
    quandoUsar:
      "No inicio do dia, antes de reunioes de acompanhamento e para monitorar desvios de execucao.",
    tempoMedioLeitura: "10 a 14 minutos",
    nivel: "inicial",
    preRequisitos: [
      "Ter pelo menos uma obra cadastrada e atualizada.",
      "Equipe com rotinas minimas de atualizacao diaria.",
      "Permissao de acesso ao modulo Dashboard.",
    ],
    prioridadesOperacionais: [
      "Detectar atraso, risco e gargalos cedo.",
      "Priorizar tarefas da equipe com base em dados.",
      "Manter decisao diaria baseada em indicadores reais.",
    ],
    resultadoEsperado:
      "Ao final, o usuário consegue usar o dashboard como painel de comando diario, interpretando alertas com segurança.",
    passosBase: [
      "Acesse o menu Dashboard",
      "Revise indicadores principais e alertas destacados",
      "Abra os detalhes de cada indicador para decidir as proximas acoes",
      "Distribua tarefas para as equipes com base nas prioridades",
    ],
    boasPraticas: [
      "Padronize a revisao diaria do painel com seu time.",
      "Use o dashboard como fonte unica nas reunioes de status.",
      "Acompanhe tendencias semanais, não apenas o dado do dia.",
    ],
    errosComuns: [
      "Tomar decisao sem abrir os detalhes de origem do indicador.",
      "Atualizar obra de forma atrasada e perder confiabilidade do painel.",
    ],
    faq: [
      {
        pergunta: "Com que frequencia devo revisar o dashboard?",
        resposta:
          "No mínimo uma vez por dia. Em periodos criticos (entregas, medicao, auditoria), revise no inicio e no fim do expediente.",
      },
      {
        pergunta: "O que fazer quando um indicador parece incoerente?",
        resposta:
          "Abra o detalhe do indicador, valide a origem dos dados no modulo correspondente e confirme se houve atualizacao recente da equipe.",
      },
    ],
    rota: "/dashboard",
  },
  {
    slug: "obras",
    icone: "OBRA",
    titulo: "Obras",
    resumo: "Cadastro e acompanhamento completo da execucao de cada obra.",
    paraQueServe:
      "Controlar status, progresso, cliente e informacoes operacionais para manter previsibilidade.",
    quandoUsar: "Sempre que houver atualizacao de campo, mudança de fase ou novo marco de execucao.",
    tempoMedioLeitura: "12 a 16 minutos",
    nivel: "inicial",
    preRequisitos: [
      "Dados básicos do contrato e cliente definidos.",
      "Equipe responsavel pela obra vinculada.",
      "Critero de medicao de progresso alinhado internamente.",
    ],
    prioridadesOperacionais: [
      "Evitar obra sem responsavel e sem atualizacao.",
      "Registrar progresso com criterio unico.",
      "Conectar obra ao cronograma e financeiro.",
    ],
    resultadoEsperado:
      "O usuário passa a manter cada obra com status confiável, evolucao rastreável e contexto claro para toda a equipe.",
    passosBase: [
      "Entre em Obras e selecione ou cadastre uma obra",
      "Atualize status e percentual de progresso",
      "Registre eventos relevantes e observações de execucao",
      "Valide se a obra esta alinhada ao cronograma e ao financeiro",
    ],
    boasPraticas: [
      "Defina um responsavel por atualizar cada obra.",
      "Atualize progresso no mesmo dia da atividade executada.",
      "Mantenha nomenclatura padrao entre obras para facilitar comparacoes.",
    ],
    errosComuns: [
      "Manter obra sem atualizacao por varios dias.",
      "Registrar progresso sem validar impacto em prazo e custo.",
    ],
    faq: [
      {
        pergunta: "Quem deve atualizar o progresso da obra?",
        resposta:
          "Idealmente o responsavel operacional da obra, com revisao do gestor para garantir consistencia e evitar subjetividade.",
      },
      {
        pergunta: "Como evitar divergencia de percentual entre equipes?",
        resposta:
          "Defina uma regra objetiva de medicao (por etapa concluida, frente liberada ou checklist fechado) e documente no processo interno.",
      },
    ],
    rota: "/obras",
  },
  {
    slug: "cronograma",
    icone: "CRON",
    titulo: "Cronograma",
    resumo: "Planejamento das etapas e marcos para garantir entrega no prazo.",
    paraQueServe:
      "Organizar tarefas no tempo, antecipar gargalos e coordenar equipes por fase da obra.",
    quandoUsar: "Na abertura de obra, revisoes semanais e sempre que houver mudança de prazo.",
    tempoMedioLeitura: "14 a 18 minutos",
    nivel: "intermediario",
    preRequisitos: [
      "Obra com etapas macro definidas.",
      "Dependencias tecnicas mapeadas entre atividades.",
      "Responsavel por cada frente de execucao atribuido.",
    ],
    prioridadesOperacionais: [
      "Impedir atraso em cascata.",
      "Replanejar rapidamente quando houver desvio.",
      "Dar visibilidade de prazo para diretoria e cliente.",
    ],
    resultadoEsperado:
      "O usuário consegue planejar e replanejar com criterio, mantendo prazos realistas e comunicação transparente.",
    passosBase: [
      "Acesse Cronograma e selecione a obra",
      "Cadastre etapas com inicio e fim previstos",
      "Atualize status das tarefas conforme execucao real",
      "Revise dependencias para evitar atrasos em cascata",
    ],
    boasPraticas: [
      "Quebre etapas grandes em entregas menores e mensuraveis.",
      "Revise cronograma semanalmente com engenharia e operacao.",
      "Ajuste datas sempre que houver mudança de contexto em campo.",
    ],
    errosComuns: [
      "Planejar sem dependencias entre tarefas.",
      "Ignorar replanejamento apos atraso confirmado.",
    ],
    faq: [
      {
        pergunta: "Quando devo replanejar oficialmente o cronograma?",
        resposta:
          "Assim que um atraso real impactar tarefa dependente ou marco contratual. Nao espere o fechamento do mes para ajustar.",
      },
      {
        pergunta: "Qual frequencia ideal de revisao?",
        resposta:
          "Semanal no mínimo, e diaria para frentes criticas ou fases com alta interdependencia.",
      },
    ],
    rota: "/cronograma",
  },
  {
    slug: "financeiro",
    icone: "FIN",
    titulo: "Financeiro",
    resumo: "Controle de orcamento, realizado e saude financeira das obras.",
    paraQueServe:
      "Comparar previsto vs realizado, reduzir desperdicio e apoiar decisao de investimento.",
    quandoUsar: "Em fechamento semanal, aprovacao de despesas e revisao de margem por obra.",
    tempoMedioLeitura: "15 a 20 minutos",
    nivel: "intermediario",
    preRequisitos: [
      "Centro de custos e categorias definidos.",
      "Rotina de lancamentos padronizada.",
      "Responsaveis por aprovacao financeira definidos.",
    ],
    prioridadesOperacionais: [
      "Evitar surpresa de caixa no fim do ciclo.",
      "Detectar sobrecusto cedo.",
      "Conectar gasto com progresso real da obra.",
    ],
    resultadoEsperado:
      "O usuário passa a controlar desvio financeiro com antecedencia e agir antes de comprometer margem.",
    passosBase: [
      "Acesse Financeiro e filtre por obra ou periodo",
      "Lance movimentacoes e categorias corretamente",
      "Compare orcado e realizado para identificar desvios",
      "Aplique acoes corretivas e acompanhe o impacto no proximo ciclo",
    ],
    boasPraticas: [
      "Use categorias padrao para facilitar leitura gerencial.",
      "Mantenha disciplina de fechamento semanal.",
      "Cruze financeiro com progresso de obra para evitar falsas conclusoes.",
    ],
    errosComuns: [
      "Lancar despesas sem categoria.",
      "Tomar decisao olhando apenas valor total sem contexto de etapa.",
    ],
    faq: [
      {
        pergunta: "Qual indicador financeiro devo monitorar primeiro?",
        resposta:
          "Comece pelo desvio entre orcado e realizado por obra. Ele mostra rapidamente onde estao os maiores riscos de margem.",
      },
      {
        pergunta: "Como agir quando o realizado supera o previsto?",
        resposta:
          "Identifique a causa por categoria, ajuste previsoes futuras e execute plano corretivo com responsavel e prazo definido.",
      },
    ],
    rota: "/financeiro",
  },
  {
    slug: "equipes",
    icone: "EQP",
    titulo: "Equipes",
    resumo: "Gestão de profissionais, papéis e distribuicao por frente de trabalho.",
    paraQueServe:
      "Organizar colaborador por função, dar acesso correto e garantir produtividade operacional.",
    quandoUsar: "No onboarding, remanejamento de equipe e revisao de responsabilidades.",
    tempoMedioLeitura: "12 a 16 minutos",
    nivel: "inicial",
    preRequisitos: [
      "Estrutura basica de equipes definida.",
      "Politica interna de papéis e acessos validada.",
      "Cadastro mínimo de cargos padronizado.",
    ],
    prioridadesOperacionais: [
      "Garantir acesso mínimo necessário por usuário.",
      "Evitar equipe sem dono/responsavel.",
      "Melhorar visibilidade de alocacao por obra.",
    ],
    resultadoEsperado:
      "O usuário consegue manter equipes organizadas, com papéis claros e acesso coerente com função.",
    passosBase: [
      "Acesse Equipes e cadastre as equipes principais",
      "Adicione membros com cargo e equipe correspondente",
      "Revise papéis de acesso conforme responsabilidade",
      "Atualize alocacao de acordo com fase da obra",
    ],
    boasPraticas: [
      "Padronize cargos para manter relatórios consistentes.",
      "Revise acessos mensalmente para segurança.",
      "Associe equipe a objetivos claros de entrega.",
    ],
    errosComuns: [
      "Manter usuários sem equipe definida por longos periodos.",
      "Conceder papel acima da necessidade operacional.",
    ],
    faq: [
      {
        pergunta: "Quem pode gerenciar perfis e papéis?",
        resposta:
          "Recomenda-se centralizar em administradores para manter governanca e reduzir risco de acesso indevido.",
      },
      {
        pergunta: "Quando devo revisar acessos?",
        resposta:
          "No mínimo uma vez por mes e sempre que houver entrada, saida ou mudança de função do colaborador.",
      },
    ],
    rota: "/equipes",
  },
  {
    slug: "materiais",
    icone: "MAT",
    titulo: "Materiais",
    resumo: "Controle de estoque, consumo e reposicao para evitar ruptura.",
    paraQueServe:
      "Monitorar disponibilidade de insumos e antecipar compras para não parar a execucao.",
    quandoUsar: "Diariamente, principalmente em obras com alto giro de materiais.",
    tempoMedioLeitura: "13 a 17 minutos",
    nivel: "intermediario",
    preRequisitos: [
      "Itens principais de estoque cadastrados.",
      "Unidades de medida e mínimo definidos.",
      "Responsavel por entrada e saida estabelecido.",
    ],
    prioridadesOperacionais: [
      "Evitar ruptura de item critico.",
      "Reduzir compra emergencial de alto custo.",
      "Melhorar previsibilidade de abastecimento.",
    ],
    resultadoEsperado:
      "O usuário consegue controlar estoque com previsao e agir antes do material impactar prazo da obra.",
    passosBase: [
      "Acesse Materiais e revise itens criticos",
      "Atualize quantidade conforme entradas e saidas",
      "Defina mínimo por item para gerar alertas de reposicao",
      "Acione pedido de compra quando atingir limite de segurança",
    ],
    boasPraticas: [
      "Revise itens criticos no inicio da semana.",
      "Mantenha unidade de medida padronizada.",
      "Use historico de consumo para melhorar previsao de compra.",
    ],
    errosComuns: [
      "Cadastrar item duplicado com nomes diferentes.",
      "Nao registrar consumo no momento da retirada.",
    ],
    faq: [
      {
        pergunta: "Como definir o mínimo ideal por material?",
        resposta:
          "Use media de consumo da obra + prazo medio de reposicao + margem de segurança para variacao de demanda.",
      },
      {
        pergunta: "Quando abrir pedido de compra?",
        resposta:
          "Assim que o estoque se aproximar do limite mínimo, priorizando itens com reposicao mais demorada.",
      },
    ],
    rota: "/materiais",
  },
  {
    slug: "qualidade",
    icone: "QLD",
    titulo: "Qualidade",
    resumo: "Registro de não conformidades, inspecoes e planos de acao.",
    paraQueServe:
      "Aumentar padrao de entrega e reduzir retrabalho com controle de qualidade sistematico.",
    quandoUsar: "Durante inspecoes, auditorias internas e tratativa de desvios.",
    tempoMedioLeitura: "14 a 18 minutos",
    nivel: "intermediario",
    preRequisitos: [
      "Categorias de não conformidade definidas.",
      "Responsaveis por tratativa e aprovacao mapeados.",
      "Processo interno de validacao de acao corretiva definido.",
    ],
    prioridadesOperacionais: [
      "Resolver causa raiz, não apenas sintoma.",
      "Reduzir retrabalho e reincidencia.",
      "Garantir rastreabilidade de acao corretiva.",
    ],
    resultadoEsperado:
      "O usuário passa a conduzir tratativas de qualidade com disciplina, prazo e evidencia de efetividade.",
    passosBase: [
      "Acesse Qualidade e registre ocorrencia com categoria e prazo",
      "Defina responsavel pela tratativa",
      "Acompanhe status ate fechamento da acao",
      "Revise recorrencia para eliminar causa raiz",
    ],
    boasPraticas: [
      "Priorize tratamento de não conformidades criticas.",
      "Documente evidencias de antes e depois.",
      "Promova revisao mensal de aprendizados.",
    ],
    errosComuns: [
      "Fechar ocorrencia sem validar efetividade da acao.",
      "Nao registrar prazo e responsavel na abertura.",
    ],
    faq: [
      {
        pergunta: "Qual diferenca entre corrigir e prevenir?",
        resposta:
          "Corrigir resolve o problema atual; prevenir altera processo para evitar repeticao futura. Os dois devem ser registrados.",
      },
      {
        pergunta: "Como saber se a acao foi eficaz?",
        resposta:
          "Acompanhe indicadores de reincidencia e valide em campo se a causa raiz realmente deixou de ocorrer.",
      },
    ],
    rota: "/qualidade",
  },
  {
    slug: "relatórios",
    icone: "REL",
    titulo: "Relatórios",
    resumo: "Geracao de relatórios gerenciais para operacao, cliente e diretoria.",
    paraQueServe:
      "Consolidar informacoes da obra em visoes executivas para tomada de decisao e comunicação.",
    quandoUsar: "Em fechamento semanal/mensal, reunioes com cliente e apresentacoes de performance.",
    tempoMedioLeitura: "11 a 15 minutos",
    nivel: "inicial",
    preRequisitos: [
      "Dados de origem atualizados nos modulos operacionais.",
      "Tipo de relatório e publico-alvo definidos.",
      "Formato de saida (PDF, Excel) escolhido conforme objetivo.",
    ],
    prioridadesOperacionais: [
      "Padronizar comunicação com cliente e diretoria.",
      "Reduzir tempo de consolidacao manual.",
      "Garantir consistencia entre periodos.",
    ],
    resultadoEsperado:
      "O usuário consegue gerar relatórios completos, sem retrabalho e com narrativa executiva clara.",
    passosBase: [
      "Acesse Relatórios e selecione o tipo desejado",
      "Defina escopo por obra e formato de saida",
      "Solicite geracao e acompanhe status",
      "Compartilhe o arquivo final com os envolvidos",
    ],
    boasPraticas: [
      "Padronize periodicidade por tipo de relatório.",
      "Valide dados de origem antes de exportar.",
      "Mantenha historico para comparar evolucao.",
    ],
    errosComuns: [
      "Gerar relatório sem filtro adequado de escopo.",
      "Enviar versao sem revisao final de consistencia.",
    ],
    faq: [
      {
        pergunta: "Qual relatório usar para diretoria?",
        resposta:
          "Priorize sumario executivo e financeiro consolidado, com foco em riscos, desvios e decisoes recomendadas.",
      },
      {
        pergunta: "Como evitar divergencia entre relatórios de semanas diferentes?",
        resposta:
          "Padronize recorte temporal, fonte de dados e checklist de revisao antes do envio.",
      },
    ],
    rota: "/relatorios",
  },
  {
    slug: "configuracoes",
    icone: "CFG",
    titulo: "Configuracoes",
    resumo: "Ajustes de conta, empresa, segurança, perfis e preferencias.",
    paraQueServe:
      "Centralizar parametrizacao da plataforma e garantir governanca de acesso.",
    quandoUsar: "Na implantacao inicial e em revisoes periodicas de segurança/processo.",
    tempoMedioLeitura: "16 a 22 minutos",
    nivel: "avancado",
    preRequisitos: [
      "Perfil com permissao administrativa.",
      "Politica de acesso e segurança da empresa definida.",
      "Responsavel por governanca digital designado.",
    ],
    prioridadesOperacionais: [
      "Manter segurança e conformidade da conta.",
      "Garantir estrutura de perfis alinhada ao organograma.",
      "Padronizar preferencias da operacao.",
    ],
    resultadoEsperado:
      "O usuário consegue administrar a plataforma com segurança, clareza de papéis e rastreabilidade de ajustes.",
    passosBase: [
      "Acesse Configuracoes e revise dados da empresa",
      "Cadastre e mantenha perfis de funcionarios atualizados",
      "Ajuste preferencias e controles de segurança",
      "Registre solicitacoes LGPD quando necessário",
    ],
    boasPraticas: [
      "Revisar permissao de usuários periodicamente.",
      "Manter cadastro empresarial sempre atualizado.",
      "Documentar alteracoes relevantes de segurança.",
    ],
    errosComuns: [
      "Criar usuários sem definir papel apropriado.",
      "Deixar dados de contato desatualizados.",
    ],
    faq: [
      {
        pergunta: "Com que frequencia devo revisar papéis de acesso?",
        resposta:
          "No mínimo mensalmente, e imediatamente apos mudança de cargo ou desligamento de colaborador.",
      },
      {
        pergunta: "Quando abrir solicitacao LGPD?",
        resposta:
          "Sempre que houver pedido formal de titular para acesso, correcao, portabilidade ou exclusao de dados.",
      },
    ],
    rota: "/configuracoes",
  },
];

const GUIAS: GuiaItem[] = GUIAS_BASE.map((guia) => ({
  ...guia,
  passosDetalhados: guia.passosBase.map((passo, index) => buildPassoDetalhado(guia, passo, index)),
}));

export function listGuias() {
  return GUIAS;
}

export function getGuiaBySlug(slug: string) {
  return GUIAS.find((item) => item.slug === slug) ?? null;
}
