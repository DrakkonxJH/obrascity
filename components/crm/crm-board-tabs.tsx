"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type BoardTab = {
  slug: string;
  label: string;
};

const STORAGE_KEY = "obrasflow.crm.boards.v1";
const DEFAULT_BOARD: BoardTab = { slug: "geral", label: "Geral" };

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CrmBoardTabs({ selectedBoard }: { selectedBoard: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const [boards, setBoards] = useState<BoardTab[]>(() => {
    if (typeof window === "undefined") return [DEFAULT_BOARD];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [DEFAULT_BOARD];
    try {
      const parsed = JSON.parse(raw) as BoardTab[];
      if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_BOARD];
      const merged = [...parsed];
      if (!merged.some((item) => item.slug === DEFAULT_BOARD.slug)) {
        merged.unshift(DEFAULT_BOARD);
      }
      return merged;
    } catch {
      return [DEFAULT_BOARD];
    }
  });

  const safeSelected = useMemo(
    () => (boards.some((board) => board.slug === selectedBoard) ? selectedBoard : DEFAULT_BOARD.slug),
    [boards, selectedBoard],
  );

  function persist(nextBoards: BoardTab[]) {
    setBoards(nextBoards);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextBoards));
    }
  }

  function goToBoard(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("board", slug);
    router.push(`${pathname}?${params.toString()}`);
  }

  function addBoard() {
    const label = input.trim();
    if (!label) return;
    const slug = slugify(label);
    if (!slug) return;
    if (boards.some((board) => board.slug === slug)) {
      goToBoard(slug);
      setInput("");
      return;
    }
    const nextBoards = [...boards, { slug, label }];
    persist(nextBoards);
    goToBoard(slug);
    setInput("");
  }

  return (
    <article className="of-card" style={{ marginBottom: 14, padding: 10 }}>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {boards.map((board) => (
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
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="of-input"
            placeholder="Nova aba/quadro (ex.: Captação Norte)"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addBoard();
              }
            }}
          />
          <button type="button" className="of-btn-ghost" onClick={addBoard}>
            + Nova aba
          </button>
        </div>
      </div>
    </article>
  );
}
