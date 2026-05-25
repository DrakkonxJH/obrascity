"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { createObraAction } from "@/app/(app)/obras/actions";
import { useAppUi } from "./app-ui-provider";

export function NovaObraModal() {
  const { novaObraOpen, closeNovaObra } = useAppUi();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!novaObraOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await createObraAction(formData);
        closeNovaObra();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao criar obra");
      }
    });
  }

  return (
    <div
      className="of-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nova-obra-title"
      onClick={closeNovaObra}
    >
      <div className="of-modal" onClick={(e) => e.stopPropagation()}>
        <h2 id="nova-obra-title" className="of-modal-title">
          Nova Obra
        </h2>
        <p className="of-modal-sub">Preencha os dados para cadastrar uma nova obra na plataforma.</p>
        <form onSubmit={handleSubmit}>
          <p className="of-form-section-label">Informações Básicas</p>
          <div style={{ marginBottom: 16 }}>
            <label className="of-form-label" htmlFor="obra-nome">
              Nome da Obra
            </label>
            <input id="obra-nome" name="nome" required className="of-input" placeholder="Ex: Edifício Central Park" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="of-form-label" htmlFor="obra-cliente">
              Cliente / Contratante
            </label>
            <input id="obra-cliente" name="cliente" required className="of-input" placeholder="Ex: Construtora ABC" />
          </div>
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <label className="of-form-label" htmlFor="obra-status">
              Status
            </label>
            <select id="obra-status" name="status" className="of-input" defaultValue="planejamento">
              <option value="planejamento">Planejamento</option>
              <option value="andamento">Em Andamento</option>
              <option value="atencao">Atenção</option>
              <option value="concluida">Concluída</option>
            </select>
          </div>
          <p className="of-empty-text" style={{ marginBottom: 12 }}>
            Dados complementares da obra (localização, datas e contrato) são preenchidos na página completa.
          </p>
          {error ? <p style={{ color: "var(--of-red)", fontSize: "0.85rem" }}>{error}</p> : null}
          <div className="of-modal-footer">
            <button type="button" className="of-btn-cancel" onClick={closeNovaObra}>
              Cancelar
            </button>
            <button type="submit" className="of-btn-save" disabled={pending}>
              {pending ? "Salvando..." : "Salvar Obra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
