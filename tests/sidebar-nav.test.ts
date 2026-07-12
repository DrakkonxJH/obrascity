import test from "node:test";
import assert from "node:assert/strict";
import { buildNavSections } from "@/components/templates/sidebar";

test("navegação padrão inclui grupos essenciais pós-login", () => {
  const sections = buildNavSections(false, false);
  const titles = sections.map((section) => section.title);

  assert.ok(titles.includes("Principal"));
  assert.ok(titles.includes("Gestão"));
  assert.ok(titles.includes("Sistema"));
});

test("modo admin-only restringe navegação para SaaS/Operacao", () => {
  const sections = buildNavSections(true, true);
  const titles = sections.map((section) => section.title);

  assert.deepEqual(titles, ["SaaS", "Operacao"]);
});
