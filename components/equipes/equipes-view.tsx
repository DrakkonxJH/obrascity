"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { EquipeItem, MembroItem } from "@/lib/db/equipes";
import { getAvatarColor, getTeamStyle, initialsFromCargo } from "@/lib/demo/team-styles";
import { useAppUi } from "@/components/shell/app-ui-provider";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";

type EquipesViewProps = {
  equipes: EquipeItem[];
  membros: MembroItem[];
  formSlot?: ReactNode;
};

export function EquipesView({ equipes, membros, formSlot }: EquipesViewProps) {
  const [search, setSearch] = useState("");
  const { openAddMember, openDetail } = useAppUi();

  const membrosPorEquipe = useMemo(() => {
    const map = new Map<string, MembroItem[]>();
    for (const m of membros) {
      if (!m.equipe_id) continue;
      const list = map.get(m.equipe_id) ?? [];
      list.push(m);
      map.set(m.equipe_id, list);
    }
    return map;
  }, [membros]);

  const filteredMembros = membros.filter((m, index) => {
    const q = search.toLowerCase();
    const cargo = (m.cargo ?? "").toLowerCase();
    const nome = (m.nome ?? "").toLowerCase();
    const equipe = equipes.find((e) => e.id === m.equipe_id)?.nome.toLowerCase() ?? "";
    return !q || cargo.includes(q) || nome.includes(q) || equipe.includes(q) || `profissional #${index + 1}`.includes(q);
  });

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Equipes"
        title="Mobilizacao e alocacao"
        subtitle={`${membros.length} profissionais em ${equipes.length} equipes`}
        actions={
          <button type="button" className="of-btn-primary" onClick={openAddMember}>
            <Plus size={16} aria-hidden />
            Adicionar membro
          </button>
        }
      />
      {formSlot}

      <div className="of-teams-grid">
        {equipes.map((equipe, index) => {
          const style = getTeamStyle(index);
          const teamMembers = membrosPorEquipe.get(equipe.id) ?? [];
          return (
            <article
              key={equipe.id}
              className="of-team-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                openDetail({
                  title: equipe.nome,
                  rows: [
                    { label: "Especialidade", value: equipe.especialidade ?? "—" },
                    { label: "Membros", value: String(teamMembers.length) },
                    { label: "Obras vinculadas", value: "Não configurado" },
                  ],
                })
              }
            >
              <div className="of-team-head">
                <div className="of-team-icon" style={{ background: style.bg, color: style.color }}>
                  {style.icon}
                </div>
                <div>
                  <p className="of-team-name">{equipe.nome}</p>
                  <p className="of-team-role">{equipe.especialidade ?? "Sem especialidade"}</p>
                </div>
              </div>
              <div className="of-team-avatars">
                {teamMembers.slice(0, 3).map((m, mi) => (
                  <span
                    key={m.id}
                    className="of-team-avatar"
                    style={{ background: getAvatarColor(mi) }}
                  >
                    {initialsFromCargo(m.cargo, mi)}
                  </span>
                ))}
                {teamMembers.length > 3 ? (
                  <span className="of-team-avatar" style={{ background: "#3B7BFF" }}>
                    +{teamMembers.length - 3}
                  </span>
                ) : null}
              </div>
              <div className="of-team-meta">
                <span>{teamMembers.length} membros</span>
                <span className={`of-badge ${style.badge}`}>Equipe ativa</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="of-table-wrap">
        <div
          style={{
            padding: "14px 16px",
            background: "var(--of-bg-3)",
            borderBottom: "1px solid var(--of-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--of-text-2)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
            Todos os Profissionais
          </span>
          <div className="of-search-wrap" style={{ width: 200, minWidth: 160, flex: "none" }}>
            <span className="of-search-icon">🔍</span>
            <input
              className="of-search-input"
              style={{ fontSize: "0.8rem", padding: "6px 12px 6px 30px" }}
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <table className="of-table">
          <thead>
            <tr>
              <th>Profissional</th>
              <th>Cargo</th>
              <th>Equipe</th>
              <th>Status</th>
              <th>Contato</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembros.map((membro, index) => {
              const equipe = equipes.find((e) => e.id === membro.equipe_id);
              const initials = initialsFromCargo(membro.cargo, index);
              return (
                <tr key={membro.id}>
                  <td>
                    <div className="of-member-name-cell">
                      <span className="of-member-avatar" style={{ background: getAvatarColor(index) }}>
                        {initials}
                      </span>
                      <div>
                        <p className="of-list-title">{membro.nome ?? `Profissional ${initials}`}</p>
                        <p className="of-member-email">{membro.crea ? `CREA ${membro.crea}` : "Sem registro"}</p>
                      </div>
                    </div>
                  </td>
                  <td>{membro.cargo ?? "Não informado"}</td>
                  <td>{equipe?.nome ?? "Sem equipe"}</td>
                  <td>
                    <span className="of-badge of-badge-green">Ativo</span>
                  </td>
                  <td>{membro.email ?? "Sem e-mail"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
