"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { createMembroAction } from "@/app/(app)/equipes/member-actions";
import type { EquipeItem } from "@/lib/db/equipes";
import { useAppUi } from "@/components/templates/app-ui-provider";

type AddMemberModalProps = {
  equipes: EquipeItem[];
};

export function AddMemberModal({ equipes }: AddMemberModalProps) {
  const { addMemberOpen, closeAddMember } = useAppUi();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!addMemberOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await createMembroAction(formData);
        closeAddMember();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao adicionar membro");
      }
    });
  }

  return (
    <div className="of-modal-overlay" role="dialog" aria-modal="true" onClick={closeAddMember}>
      <div className="of-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="of-modal-title">Adicionar Membro</h2>
        <p className="of-modal-sub">Vincule um profissional a uma equipe.</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="of-form-label" htmlFor="membro-cargo">
              Cargo
            </label>
            <input id="membro-cargo" name="cargo" required className="of-input" placeholder="Ex: Engenheiro Civil" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="of-form-label" htmlFor="membro-crea">
              CREA / Registro
            </label>
            <input id="membro-crea" name="crea" className="of-input" placeholder="Opcional" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="of-form-label" htmlFor="membro-equipe">
              Equipe
            </label>
            <select id="membro-equipe" name="equipe_id" className="of-input" defaultValue="">
              <option value="">Sem equipe</option>
              {equipes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>
          {error ? <p style={{ color: "var(--of-red)", fontSize: "0.85rem" }}>{error}</p> : null}
          <div className="of-modal-footer">
            <button type="button" className="of-btn-cancel" onClick={closeAddMember}>
              Cancelar
            </button>
            <button type="submit" className="of-btn-save" disabled={pending}>
              {pending ? "Salvando..." : "Adicionar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
