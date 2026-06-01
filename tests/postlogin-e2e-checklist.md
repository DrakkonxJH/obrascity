# Pós-login E2E Checklist

## Escopo
- Principal: `/dashboard`, `/obras`, `/cronograma`
- Gestão: `/viabilidade`, `/crm`, `/projetos`, `/financeiro`, `/equipes`, `/materiais`, `/mudancas`, `/diario`, `/qualidade`, `/entrega`, `/garantia`, `/relatorios`
- Sistema: `/planos`, `/portal`, `/suporte`, `/governanca`, `/seguranca-corporativa`, `/mobile-campo`, `/configuracoes`

## Fluxos críticos
1. Navegar pela sidebar sem erro visual nem erro de rota.
2. Confirmar renderização de `PageHeader` (eyebrow, título, subtítulo e ações) em cada tela.
3. Validar estados:
   - carregamento
   - vazio sem quebra de layout
   - erro com mensagem visível
4. Confirmar foco por teclado:
   - `Tab` percorre ações principais
   - `Enter` e `Espaço` funcionam em componentes interativos
5. Verificar filtros principais:
   - alteração de filtros atualiza listagem
   - reset/reaplicar não quebra estado
6. Validar links cruzados de ações no header (ida e volta entre módulos).

## Critério de aceite
- Nenhuma rota do escopo com erro de navegação.
- Nenhum bloqueio de interação por teclado.
- Nenhum estado vazio/erro sem feedback textual.
