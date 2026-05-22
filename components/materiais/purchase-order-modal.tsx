"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createPurchaseOrderAction,
  importPurchaseOrdersAction,
  type ImportMaterialsState,
} from "@/app/(app)/materiais/actions";

type OptionItem = {
  id: string;
  nome: string;
};

type PurchaseOrderModalProps = {
  materiais: OptionItem[];
  obras: OptionItem[];
};

const initialState: ImportMaterialsState = {
  status: "idle",
  message: "",
};

function statusClass(status: ImportMaterialsState["status"]) {
  if (status === "success") return "border-[#19c37d]/40 bg-[#19c37d]/10 text-[#a8f5c2]";
  if (status === "error") return "border-[#ff4060]/40 bg-[#ff4060]/10 text-[#ff9aad]";
  return "border-[#24324f] bg-[#0f1525] text-[#8c99b8]";
}

export function PurchaseOrderModal({ materiais, obras }: PurchaseOrderModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "import">("create");
  const [createState, createAction, createPending] = useActionState(createPurchaseOrderAction, initialState);
  const [importState, importAction, importPending] = useActionState(importPurchaseOrdersAction, initialState);
  const createFormRef = useRef<HTMLFormElement>(null);
  const importFormRef = useRef<HTMLFormElement>(null);

  function closeModal() {
    setMode("create");
    setOpen(false);
  }

  useEffect(() => {
    if (createState.status === "success") {
      createFormRef.current?.reset();
    }
  }, [createState.status]);

  useEffect(() => {
    if (importState.status === "success") {
      importFormRef.current?.reset();
    }
  }, [importState.status]);

  return (
    <>
      <button type="button" className="of-btn-primary" onClick={() => setOpen(true)}>
        + Pedido de Compra
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-4xl rounded-2xl border border-[#24324f] bg-[#0b1020] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Pedido de compra</h2>
                <p className="text-sm text-[#8c99b8]">Cadastre manualmente ou importe uma planilha.</p>
              </div>
              <button type="button" className="of-btn-ghost" onClick={closeModal}>
                Fechar
              </button>
            </div>

            <div className="mb-5 flex gap-2">
              <button
                type="button"
                className={mode === "create" ? "of-btn-primary" : "of-btn-ghost"}
                onClick={() => setMode("create")}
              >
                Novo pedido
              </button>
              <button
                type="button"
                className={mode === "import" ? "of-btn-primary" : "of-btn-ghost"}
                onClick={() => setMode("import")}
              >
                Importar pedidos
              </button>
            </div>

            {mode === "create" ? (
              <form ref={createFormRef} action={createAction} className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="of-form-label" htmlFor="purchase-material">
                    Material
                  </label>
                  <select id="purchase-material" name="material_id" className="of-input" required>
                    <option value="">Selecione...</option>
                    {materiais.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="of-form-label" htmlFor="purchase-obra">
                    Obra
                  </label>
                  <select id="purchase-obra" name="obra_id" className="of-input" required>
                    <option value="">Selecione...</option>
                    {obras.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="of-form-label" htmlFor="purchase-fornecedor">
                    Fornecedor
                  </label>
                  <input id="purchase-fornecedor" name="fornecedor" className="of-input" required />
                </div>
                <div>
                  <label className="of-form-label" htmlFor="purchase-quantidade">
                    Quantidade
                  </label>
                  <input id="purchase-quantidade" name="quantidade" type="number" step="0.01" defaultValue="0" className="of-input" />
                </div>
                <div>
                  <label className="of-form-label" htmlFor="purchase-valor">
                    Valor
                  </label>
                  <input id="purchase-valor" name="valor" type="number" step="0.01" defaultValue="0" className="of-input" />
                </div>
                <div>
                  <label className="of-form-label" htmlFor="purchase-status">
                    Status
                  </label>
                  <select id="purchase-status" name="status" className="of-input" defaultValue="pendente">
                    <option value="pendente">Pendente</option>
                    <option value="aguardando">Aguardando</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="rejeitado">Rejeitado</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-3">
                  {createState.message ? (
                    <p className={`mr-auto rounded-md border px-3 py-2 text-sm ${statusClass(createState.status)}`}>
                      {createState.message}
                    </p>
                  ) : null}
                  <button type="button" className="of-btn-ghost" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={createPending} className="of-btn-primary">
                    {createPending ? "Salvando..." : "Salvar pedido"}
                  </button>
                </div>
              </form>
            ) : (
              <form ref={importFormRef} action={importAction} className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 rounded-xl border border-[#24324f] bg-[#0f1525] p-4">
                  <p className="text-sm text-[#8c99b8]">
                    Envie um CSV com: <strong>material</strong>, <strong>obra</strong>, <strong>fornecedor</strong>, <strong>quantidade</strong>, <strong>valor</strong>, <strong>status</strong>.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="of-form-label" htmlFor="purchase-import-file">
                    Planilha CSV
                  </label>
                  <input id="purchase-import-file" name="file" type="file" accept=".csv,text/csv" className="of-input" required />
                </div>
                <div className="md:col-span-2 flex items-center justify-end gap-3">
                  {importState.message ? (
                    <p className={`mr-auto rounded-md border px-3 py-2 text-sm ${statusClass(importState.status)}`}>
                      {importState.message}
                    </p>
                  ) : null}
                  <button type="button" className="of-btn-ghost" onClick={closeModal}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={importPending} className="of-btn-primary">
                    {importPending ? "Importando..." : "Importar pedidos"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
