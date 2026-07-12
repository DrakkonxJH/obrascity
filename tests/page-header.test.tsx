import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { PageHeader } from "@/components/molecules/page-header";

test("renderiza eyebrow, título, subtítulo e ações quando informados", () => {
  const html = renderToStaticMarkup(
    <PageHeader
      eyebrow="Operação"
      title="Painel"
      subtitle="Resumo de execução"
      actions={<button type="button">Ação</button>}
    />,
  );

  assert.match(html, /Operação/);
  assert.match(html, /Painel/);
  assert.match(html, /Resumo de execução/);
  assert.match(html, /Ação/);
});

test("não renderiza blocos opcionais quando não informados", () => {
  const html = renderToStaticMarkup(<PageHeader title="Somente título" />);
  assert.match(html, /Somente título/);
  assert.doesNotMatch(html, /of-page-eyebrow/);
  assert.doesNotMatch(html, /of-page-subtitle/);
  assert.doesNotMatch(html, /of-page-head-actions/);
});
