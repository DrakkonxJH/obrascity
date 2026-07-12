"use client";

import { useActionState, useEffect, useRef } from "react";
import { importMaterialsAction, type ImportMaterialsState } from "@/app/(app)/materiais/actions";

const initialImportMaterialsState: ImportMaterialsState = {
  status: "idle",
  message: "",
};

export function MaterialImportButton() {
  const [state, formAction, pending] = useActionState(importMaterialsAction, initialImportMaterialsState);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form ref={formRef} action={formAction} style={{ display: "inline-flex", alignItems: "center" }}>
      <input
        ref={inputRef}
        id="material-import-file"
        name="file"
        type="file"
        accept=".csv,text/csv"
        required
        style={{ display: "none" }}
        onChange={() => formRef.current?.requestSubmit()}
      />
      <button
        type="button"
        className="of-btn-ghost"
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        onClick={() => inputRef.current?.click()}
      >
        📥 Importar
      </button>
      {pending ? <span className="ml-2 text-sm text-[#8c99b8]">Enviando...</span> : null}
      {state.status === "error" && state.message ? (
        <span className="ml-2 text-sm text-[#ff9aad]">{state.message}</span>
      ) : null}
    </form>
  );
}
