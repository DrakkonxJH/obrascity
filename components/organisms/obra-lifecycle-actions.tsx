"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Obra } from "@/types/domain";
import { deleteObraAction, restoreObraAction } from "@/app/(app)/obras/actions";
import { useAppUi } from "@/components/templates/app-ui-provider";

type ObraLifecycleActionsProps = {
  obra: Obra;
  onDone?: () => void;
  afterActionHref?: string;
  compact?: boolean;
};

export function ObraLifecycleActions({ obra, onDone, afterActionHref, compact = false }: ObraLifecycleActionsProps) {
  const router = useRouter();
  const { trashEnabled } = useAppUi();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function finish() {
    onDone?.();
    if (afterActionHref) {
      router.push(afterActionHref);
      return;
    }
    router.refresh();
  }

  function handleDelete() {
    if (!window.confirm(`Mover a obra "${obra.nome}" para a lixeira? Ela poderá ser restaurada em até 15 dias.`)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await deleteObraAction(obra.id);
        finish();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao mover obra para a lixeira");
      }
    });
  }

  function handleRestore() {
    if (!window.confirm(`Restaurar a obra "${obra.nome}" da lixeira?`)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await restoreObraAction(obra.id);
        finish();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao restaurar obra");
      }
    });
  }

  if (!trashEnabled && !obra.deleted_at) {
    return null;
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {obra.deleted_at ? (
          <button type="button" className={compact ? "of-btn-primary" : "of-btn-ghost"} onClick={handleRestore} disabled={pending}>
            {pending ? "Restaurando..." : "Restaurar obra"}
          </button>
        ) : (
          <button type="button" className={compact ? "of-btn-primary" : "of-btn-ghost"} onClick={handleDelete} disabled={pending}>
            {pending ? "Movendo..." : "Mover para lixeira"}
          </button>
        )}
      </div>
      {error ? <p style={{ color: "var(--of-red)", fontSize: "0.85rem" }}>{error}</p> : null}
    </div>
  );
}
