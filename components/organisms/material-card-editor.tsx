"use client";

import { useState } from "react";
import type { MaterialItem } from "@/lib/db/materiais";
import { updateMaterialAction } from "@/app/(app)/materiais/actions";

type MaterialCardEditorProps = {
  material: MaterialItem;
  suggestionsId: string;
};

export function MaterialCardEditor({ material, suggestionsId }: MaterialCardEditorProps) {
  const [open, setOpen] = useState(false);

  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} style={{ marginTop: 12 }}>
      <summary className="of-empty-text" style={{ cursor: "pointer" }}>
        Editar material
      </summary>
      <form
        action={async (formData) => {
          await updateMaterialAction(formData);
          setOpen(false);
        }}
        className="of-form-grid"
        style={{ marginTop: 12 }}
      >
        <input type="hidden" name="id" value={material.id} />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="of-form-label" htmlFor={`nome-${material.id}`}>
            Material
          </label>
          <input
            id={`nome-${material.id}`}
            name="nome"
            defaultValue={material.nome}
            list={suggestionsId}
            autoComplete="off"
            className="of-input"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="of-form-label" htmlFor={`unidade-${material.id}`}>
            Unidade
          </label>
          <input id={`unidade-${material.id}`} name="unidade" defaultValue={material.unidade} className="of-input" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="of-form-label" htmlFor={`quantidade-${material.id}`}>
            Estoque atual
          </label>
          <input
            id={`quantidade-${material.id}`}
            name="quantidade"
            type="number"
            step="0.01"
            defaultValue={material.quantidade}
            className="of-input"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="of-form-label" htmlFor={`mínimo-${material.id}`}>
            Estoque mínimo
          </label>
          <input
            id={`mínimo-${material.id}`}
            name="mínimo"
            type="number"
            step="0.01"
            defaultValue={material.mínimo}
            className="of-input"
          />
        </div>
        <button type="submit" className="of-btn-primary">
          Salvar alterações
        </button>
      </form>
    </details>
  );
}
