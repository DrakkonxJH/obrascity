"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createCrmBoardAction } from "@/app/(app)/crm/actions";

type BoardTab = {
  slug: string;
  label: string;
};

const DEFAULT_BOARD: BoardTab = { slug: "geral", label: "Geral" };

export function CrmBoardTabs({ selectedBoard, boards }: { selectedBoard: string; boards: BoardTab[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const mergedBoards = useMemo(() => {
    const safe = Array.isArray(boards) ? boards : [];
    if (safe.some((item) => item.slug === DEFAULT_BOARD.slug)) return safe;
    return [DEFAULT_BOARD, ...safe];
  }, [boards]);

  const safeSelected = useMemo(
    () => (mergedBoards.some((board) => board.slug === selectedBoard) ? selectedBoard : DEFAULT_BOARD.slug),
    [mergedBoards, selectedBoard],
  );

  function goToBoard(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("board", slug);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <article className="of-card" style={{ marginBottom: 14, padding: 10 }}>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {mergedBoards.map((board) => (
            <button
              key={board.slug}
              type="button"
              className={board.slug === safeSelected ? "of-btn-primary" : "of-btn-ghost"}
              style={{ minHeight: 36 }}
              onClick={() => goToBoard(board.slug)}
            >
              {board.label}
            </button>
          ))}
        </div>
        <form action={createCrmBoardAction} style={{ display: "flex", gap: 8 }}>
          <input
            name="label"
            className="of-input"
            placeholder="Nova aba/quadro (ex.: Captação Norte)"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                if (!input.trim()) {
                  event.preventDefault();
                }
              }
            }}
          />
          <button
            type="submit"
            className="of-btn-ghost"
            onClick={() => {
              if (input.trim()) {
                setInput("");
              }
            }}
          >
            + Nova aba
          </button>
        </form>
      </div>
    </article>
  );
}
