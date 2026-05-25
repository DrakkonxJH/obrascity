import test from "node:test";
import assert from "node:assert/strict";
import { canApproveForRole, requiresApprovalForAmount, resolveRequiredRoleByAmount } from "@/lib/approvals/policy";

test("define alçada requerida por valor", () => {
  assert.equal(resolveRequiredRoleByAmount(1000), "tecnico");
  assert.equal(resolveRequiredRoleByAmount(10000), "engenheiro");
  assert.equal(resolveRequiredRoleByAmount(30000), "gestor");
  assert.equal(resolveRequiredRoleByAmount(120000), "administrador");
});

test("indica quando solicitante precisa de aprovação", () => {
  assert.equal(requiresApprovalForAmount("tecnico", 6000), true);
  assert.equal(requiresApprovalForAmount("gestor", 10000), false);
});

test("valida hierarquia de aprovação", () => {
  assert.equal(canApproveForRole("administrador", "gestor"), true);
  assert.equal(canApproveForRole("tecnico", "gestor"), false);
});
