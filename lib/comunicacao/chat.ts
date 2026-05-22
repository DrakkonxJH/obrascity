// Chat Integrado por Projeto

export type TipoMensagem = "texto" | "imagem" | "arquivo" | "mencao" | "sistema";

export interface Conversa {
  id: string;
  obra_id: string;
  nome: string;
  descricao?: string;
  tipo: "geral" | "tarefa" | "problema" | "privada";
  membros: string[]; // user_ids
  criado_em: Date;
  atualizado_em: Date;
}

export interface Mensagem {
  id: string;
  conversa_id: string;
  usuário_id: string;
  tipo: TipoMensagem;
  conteudo: string;
  mencoes: string[]; // user_ids mencionados
  url_midia?: string;
  nome_arquivo?: string;
  reacoes: Record<string, string[]>; // emoji -> [user_ids]
  editada_em?: Date;
  deletada_em?: Date;
  criada_em: Date;
}

export interface MembroCConversa {
  conversa_id: string;
  usuário_id: string;
  ultimo_acesso: Date;
  nao_lidas: number;
  silenciada: boolean;
}

export interface NotificacaoMencao {
  id: string;
  usuário_id: string;
  mensagem_id: string;
  conversa_id: string;
  usuário_que_mencionou: string;
  lida: boolean;
  criada_em: Date;
}

export function extrairMencoes(texto: string): string[] {
  const regex = /@(\w+)/g;
  const mencoes: string[] = [];
  let match;
  
  while ((match = regex.exec(texto)) !== null) {
    mencoes.push(match[1]);
  }
  
  return mencoes;
}

export function formatarMencao(userId: string, nomeUsuário: string): string {
  return `@${nomeUsuário}`;
}
