# Materiais importação CSV

## Objetivo
Adicionar importação real de materiais na tela `/materiais`, permitindo carregar uma planilha CSV com sugestoes de materiais e atualizar/criar registros existentes.

## Escopo
- Botão de importar vira formulário funcional.
- Upload de CSV com cabeçalhos flexíveis.
- Importação faz upsert por `nome + unidade`.
- Após importar, a página é revalidada.

## Passos
1. Implementar parser CSV no servidor.
2. Criar função de importação no acesso a dados.
3. Conectar a UI ao novo action.
4. Validar lint.
