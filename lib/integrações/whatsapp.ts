// Integração WhatsApp

export interface ConfigWhatsApp {
  id: string;
  empresa_id: string;
  phone_number: string; // Número da empresa (incluindo +55)
  access_token: string;
  ativo: boolean;
  verificado: boolean;
  criado_em: Date;
}

export interface MensagemWhatsApp {
  id: string;
  empresa_id: string;
  destinatario: string; // Número do destinatário
  mensagem: string;
  tipo: "texto" | "imagem" | "documento" | "localizacao";
  url_midia?: string;
  status: "pendente" | "enviado" | "entregue" | "lido" | "erro";
  timestamp_envio: Date;
  timestamp_entrega?: Date;
  erro?: string;
}

export interface MensagensPre {
  id: string;
  empresa_id: string;
  nome: string;
  tipo_evento: string; // "obra_atrasada", "tarefa_vencida", etc
  template: string; // Usar {{variável}} para templates
  ativo: boolean;
}

export const mensagensTemplate = {
  obra_atrasada: "⚠️ Obra {{obra_nome}} está {{dias}} dias atrasada! Status: {{status}}",
  tarefa_vencida: "📋 Tarefa '{{tarefa}}' venceu em {{data}}. Ação necessária!",
  material_faltando: "📦 Material {{material}} faltando em {{obra}}. Solicitar reposição?",
  equipamento_manutencao: "🔧 Equipamento {{equipamento}} precisa manutenção em {{data}}",
  cumprimento_prazo: "✅ Parabéns! {{obra}} completada no prazo!",
};

export function processarTemplate(
  template: string,
  variaveis: Record<string, string>
): string {
  return template.replace(/{{(\w+)}}/g, (_, chave) => variaveis[chave] || "");
}

export function validarTelefone(telefone: string): boolean {
  const regex = /^\+?55\d{10,11}$/;
  return regex.test(telefone);
}
