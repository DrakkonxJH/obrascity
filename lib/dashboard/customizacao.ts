// Dashboard Customizável com Widgets

export type TipoWidget = "kpi" | "grafico" | "tabela" | "mapa" | "calendario" | "lista" | "progresso" | "galeria";
export type TamanhoWidget = "pequeno" | "medio" | "grande" | "completo";

export interface WidgetConfig {
  id: string;
  tipo: TipoWidget;
  titulo: string;
  descricao?: string;
  tamanho: TamanhoWidget;
  posicao: {
    coluna: number;
    linha: number;
  };
  dados_filtro?: {
    periodo?: "hoje" | "semana" | "mes" | "ano";
    tipos_dados?: string[];
    equipes?: string[];
  };
  criado_em: Date;
  atualizado_em: Date;
}

export interface DashboardPersonalizado {
  id: string;
  usuário_id: string;
  obra_id: string;
  nome: string;
  descricao?: string;
  widgets: WidgetConfig[];
  layout_colunas: number; // 1, 2, 3, 4 colunas
  tema: "claro" | "escuro" | "auto";
  publico: boolean;
  padrao: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

export interface ConfigPadraoWidget {
  tipo: TipoWidget;
  titulo_padrao: string;
  tamanho_padrao: TamanhoWidget;
  metricas_disponiveis: string[];
}

export const widgetsPadrao: Record<TipoWidget, ConfigPadraoWidget> = {
  kpi: {
    tipo: "kpi",
    titulo_padrao: "KPI",
    tamanho_padrao: "pequeno",
    metricas_disponiveis: ["execucao", "orcamento", "progresso_obra"],
  },
  grafico: {
    tipo: "grafico",
    titulo_padrao: "Gráfico",
    tamanho_padrao: "grande",
    metricas_disponiveis: ["linha", "barra", "pizza", "area"],
  },
  tabela: {
    tipo: "tabela",
    titulo_padrao: "Tabela de Dados",
    tamanho_padrao: "grande",
    metricas_disponiveis: ["tarefas", "equipes", "materiais"],
  },
  mapa: {
    tipo: "mapa",
    titulo_padrao: "Localização",
    tamanho_padrao: "grande",
    metricas_disponiveis: ["obras", "recursos"],
  },
  calendario: {
    tipo: "calendario",
    titulo_padrao: "Calendário",
    tamanho_padrao: "medio",
    metricas_disponiveis: ["eventos", "prazos"],
  },
  lista: {
    tipo: "lista",
    titulo_padrao: "Lista Rápida",
    tamanho_padrao: "medio",
    metricas_disponiveis: ["tarefas", "lembretes"],
  },
  progresso: {
    tipo: "progresso",
    titulo_padrao: "Progresso",
    tamanho_padrao: "pequeno",
    metricas_disponiveis: ["fases", "marcos"],
  },
  galeria: {
    tipo: "galeria",
    titulo_padrao: "Galeria",
    tamanho_padrao: "grande",
    metricas_disponiveis: ["fotos", "progresso_visual"],
  },
};

export function validarPosicaoWidget(widget: WidgetConfig, layoutColunas: number): boolean {
  return widget.posicao.coluna > 0 && widget.posicao.coluna <= layoutColunas;
}

export function calcularTamanhoPixels(tamanho: TamanhoWidget): { largura: number; altura: number } {
  const tamanhos = {
    pequeno: { largura: 300, altura: 200 },
    medio: { largura: 450, altura: 300 },
    grande: { largura: 600, altura: 400 },
    completo: { largura: 900, altura: 500 },
  };
  return tamanhos[tamanho];
}
