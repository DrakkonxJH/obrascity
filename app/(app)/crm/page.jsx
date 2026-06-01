"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";

// ─── Paleta ObrasCitY ────────────────────────────────────────────────
const C = {
  bg:      "var(--of-bg)",
  surface: "var(--of-bg-2)",
  card:    "var(--of-bg-3)",
  border:  "var(--of-border)",
  orange:  "var(--of-blue)",
  text:    "var(--of-text)",
  muted:   "var(--of-text-2)",
  faint:   "var(--of-bg-4)",
  green:   "#22C55E",
  red:     "#EF4444",
  yellow:  "#F59E0B",
  blue:    "#3B82F6",
};

const ETAPAS = ["Contato", "Qualificação", "Proposta", "Negociação", "Fechado", "Perdido"];
const DEAL_STAGES = ["novos", "qualificacao", "proposta", "negociacao", "ganho", "perdido"];

const DEAL_STAGE_META = {
  novos: { label: "Novos", bg: "#1A2035", text: "#3B82F6" },
  qualificacao: { label: "Qualificação", bg: "#1A2820", text: "#22C55E" },
  proposta: { label: "Proposta", bg: "#2A1F0A", text: "#F59E0B" },
  negociacao: { label: "Negociação", bg: "#2A1A0A", text: "#FF6B1A" },
  ganho: { label: "Ganhos", bg: "#0F2A1A", text: "#22C55E" },
  perdido: { label: "Perdidos", bg: "#2A0F0F", text: "#EF4444" },
};

const ACTIVITY_TYPES = [
  { value: "follow_up", label: "Follow-up" },
  { value: "call", label: "Ligação" },
  { value: "email", label: "E-mail" },
  { value: "meeting", label: "Reunião" },
  { value: "proposal", label: "Proposta" },
  { value: "note", label: "Nota" },
  { value: "task", label: "Tarefa" },
];

const ACTIVITY_CHANNELS = [
  { value: "manual", label: "Manual" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "call", label: "Ligação" },
  { value: "meeting", label: "Reunião" },
];

const ACTIVITY_TYPE_ICON = {
  follow_up: "FUP",
  call: "TEL",
  email: "MAIL",
  meeting: "MEET",
  proposal: "PROP",
  note: "NOTE",
  task: "TASK",
};

const HEALTH_META = {
  hot: { label: "Quente", bg: "#0F2A1A", text: "#22C55E" },
  warm: { label: "Morno", bg: "#2A2010", text: "#F59E0B" },
  cold: { label: "Frio", bg: "#2A0F0F", text: "#EF4444" },
};

const EC = {
  Contato:      { bg: "#1A2035", text: "#3B82F6" },
  Qualificação: { bg: "#1A2820", text: "#22C55E" },
  Proposta:     { bg: "#2A1F0A", text: "#F59E0B" },
  Negociação:   { bg: "#2A1A0A", text: "#FF6B1A" },
  Fechado:      { bg: "#0F2A1A", text: "#22C55E" },
  Perdido:      { bg: "#2A0F0F", text: "#EF4444" },
};

const PC = {
  Alta:  { bg: "#2A100A", text: "#FF6B1A" },
  Média: { bg: "#2A2010", text: "#F59E0B" },
  Baixa: { bg: "#10201A", text: "#22C55E" },
};

const fmt     = v => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);
const fmtDate = d => new Date(d).toLocaleDateString("pt-BR");
const fmtDateTime = d => new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
const today   = () => new Date().toISOString().split("T")[0];

function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function isBeforeToday(value) {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return false;
  return dateOnly < today();
}

function isToday(value) {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return false;
  return dateOnly === today();
}

function formatDealStage(stage) {
  return DEAL_STAGE_META[stage]?.label ?? stage;
}

function formatActivityType(type) {
  const entry = ACTIVITY_TYPES.find((item) => item.value === type);
  return entry?.label ?? type;
}

function normalizeDateKey(value) {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toISOString().slice(0, 10);
}

function computeHealth(deal) {
  if (!deal || deal.status === "perdido") return { score: 0, level: "cold" };
  if (deal.status === "ganho") return { score: 100, level: "hot" };
  let score = Number(deal.probability) || 30;
  if (isBeforeToday(deal.next_activity_at)) score -= 30;
  if (isToday(deal.next_activity_at)) score += 8;
  if ((Number(deal.activities_open) || 0) > 4) score -= 15;
  if ((Number(deal.activities_open) || 0) === 0) score -= 20;
  const bounded = Math.max(0, Math.min(100, score));
  if (bounded >= 70) return { score: bounded, level: "hot" };
  if (bounded >= 40) return { score: bounded, level: "warm" };
  return { score: bounded, level: "cold" };
}

// ─── Subcomponentes utilitários ───────────────────────────────────────
function Badge({ label, colors }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4,
      background: colors.bg, color: colors.text, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function Avatar({ name = "?", size = 32 }) {
  const ini = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const h   = name.charCodeAt(0) * 37 % 360;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.floor(size * 0.33), fontWeight: 700,
      background: `hsl(${h},40%,20%)`, color: `hsl(${h},60%,65%)` }}>
      {ini}
    </div>
  );
}

// ─── Ícones ───────────────────────────────────────────────────────────
const Ico = {
  plus:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>,
  edit:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>,
  trash:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  close:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  kanban: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>,
  list:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  grip:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/></svg>,
};

// ─── Quick-add inline (Trello-style) ──────────────────────────────────
function QuickAdd({ etapa, onAdd, onCancel }) {
  const [nome, setNome]     = useState("");
  const [contato, setContato] = useState("");
  const [valor, setValor]   = useState("");

  const inp = {
    background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12,
    color: C.text, padding: "7px 10px", fontSize: 13, outline: "none",
    width: "100%", boxSizing: "border-box", marginBottom: 8,
  };

  const handleAdd = () => {
    if (!nome.trim()) return;
    onAdd({
      id: Date.now(),
      nome: nome.trim(),
      contato: contato.trim() || "—",
      cargo: "", email: "", telefone: "",
      valor: Number(valor) || 0,
      etapa,
      origem: "Manual",
      obra: "",
      prioridade: "Média",
      ultima_atividade: today(),
      notas: "",
    });
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.orange}`, borderRadius: 12, padding: 12 }}>
      <input autoFocus style={inp} placeholder="Nome da empresa *" value={nome} onChange={e => setNome(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onCancel(); }} />
      <input style={inp} placeholder="Contato principal" value={contato} onChange={e => setContato(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onCancel(); }} />
      <input style={{ ...inp, marginBottom: 12 }} placeholder="Valor (R$)" type="number" value={valor} onChange={e => setValor(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onCancel(); }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleAdd} style={{ flex: 1, background: C.orange, border: "none", color: "#fff", borderRadius: 12, padding: "7px 0", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          Adicionar card
        </button>
        <button onClick={onCancel} style={{ background: C.faint, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 12, padding: "7px 12px", cursor: "pointer", fontSize: 13 }}>
          {Ico.close}
        </button>
      </div>
    </div>
  );
}

// ─── Card kanban (draggable) ──────────────────────────────────────────
function KanbanCard({ lead, onClick, onDragStart, onDragEnd, isDragging }) {
  const pc = PC[lead.prioridade] || { bg: C.faint, text: C.muted };
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; onDragStart(lead.id); }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        background: C.card,
        border: `1px solid ${isDragging ? C.orange : C.border}`,
        borderRadius: 12, padding: 14, cursor: "grab",
        opacity: isDragging ? 0.4 : 1,
        transition: "border-color .15s, opacity .15s",
        userSelect: "none",
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.borderColor = "#444"; }}
      onMouseLeave={e => { if (!isDragging) e.currentTarget.style.borderColor = C.border; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ color: C.muted, marginTop: 2, flexShrink: 0 }}>{Ico.grip}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>{lead.nome}</span>
        </div>
        <Badge label={lead.prioridade} colors={pc} />
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: lead.obra ? 8 : 0, paddingLeft: 20 }}>{lead.contato}{lead.cargo ? ` · ${lead.cargo}` : ""}</div>
      {lead.obra && (
        <div style={{ fontSize: 11, color: C.muted, background: C.faint, padding: "3px 8px", borderRadius: 4, marginBottom: 8, marginLeft: 20 }}>{lead.obra}</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.orange }}>{fmt(lead.valor)}</span>
        <span style={{ fontSize: 11, color: C.muted }}>{fmtDate(lead.ultima_atividade)}</span>
      </div>
    </div>
  );
}

// ─── Coluna kanban ────────────────────────────────────────────────────
function KanbanColumn({ etapa, leads, onCardClick, onAddCard, dragState, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const ec         = EC[etapa] || { text: C.muted };
  const [adding, setAdding] = useState(false);
  const isOver     = dragState.overCol === etapa && dragState.draggingId !== null;
  const colTotal   = leads.reduce((s, l) => s + l.valor, 0);

  return (
    <div
      style={{ width: 262, flexShrink: 0, display: "flex", flexDirection: "column" }}
      onDragOver={e => { e.preventDefault(); onDragOver(etapa); }}
      onDrop={e => { e.preventDefault(); onDrop(etapa); }}
    >
      {/* Cabeçalho da coluna */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: ec.text, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{etapa}</span>
          <span style={{ fontSize: 11, background: C.faint, color: C.muted, borderRadius: 10, padding: "2px 7px" }}>{leads.length}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: C.muted }}>{fmt(colTotal)}</span>
          <button
            onClick={() => setAdding(true)}
            title="Adicionar lead nesta coluna"
            style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 5, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.faint; e.currentTarget.style.color = C.orange; e.currentTarget.style.borderColor = C.orange; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
          >
            {Ico.plus}
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        style={{
          flex: 1,
          display: "flex", flexDirection: "column", gap: 8,
          padding: isOver ? "6px" : "0",
          background: isOver ? `${ec.text}10` : "transparent",
          border: isOver ? `2px dashed ${ec.text}55` : "2px dashed transparent",
          borderRadius: 10,
          minHeight: 80,
          transition: "all .15s",
        }}
      >
        {leads.map(lead => (
          <KanbanCard
            key={lead.id}
            lead={lead}
            onClick={() => onCardClick(lead)}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={dragState.draggingId === lead.id}
          />
        ))}

        {leads.length === 0 && !adding && (
          <div
            onClick={() => setAdding(true)}
            style={{ border: `1px dashed ${C.border}`, borderRadius: 12, padding: "18px 14px", textAlign: "center", color: C.muted, fontSize: 12, cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.color = C.orange; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
          >
            Adicionar lead
          </div>
        )}

        {adding && (
          <QuickAdd
            etapa={etapa}
            onAdd={lead => { onAddCard(lead); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Modal completo ───────────────────────────────────────────────────
function LeadModal({ lead, isNew, etapaInicial, onClose, onSave, saving }) {
  const empty = { nome: "", contato: "", cargo: "", email: "", telefone: "", valor: "", etapa: etapaInicial || "Contato", origem: "Site", obra: "", prioridade: "Média", notas: "" };
  const [form, setForm] = useState(lead ? { ...lead } : empty);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => onSave({ ...form, id: form.id || Date.now(), ultima_atividade: today(), valor: Number(form.valor) || 0 });

  const inp   = { background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
  const lbl   = { fontSize: 12, color: C.muted, marginBottom: 4, display: "block", fontWeight: 500 };
  const row2  = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{isNew ? "Novo lead" : "Editar lead"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}>{Ico.close}</button>
        </div>

        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={row2}>
            <div><label style={lbl}>Empresa *</label><input style={inp} value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Razão social ou nome fantasia" /></div>
            <div><label style={lbl}>Contato principal</label><input style={inp} value={form.contato} onChange={e => set("contato", e.target.value)} placeholder="Nome do responsável" /></div>
          </div>
          <div style={row2}>
            <div><label style={lbl}>Cargo</label><input style={inp} value={form.cargo} onChange={e => set("cargo", e.target.value)} placeholder="Ex: Diretor de Obras" /></div>
            <div><label style={lbl}>Valor potencial (R$)</label><input style={inp} type="number" value={form.valor} onChange={e => set("valor", e.target.value)} placeholder="0" /></div>
          </div>
          <div style={row2}>
            <div><label style={lbl}>E-mail</label><input style={inp} value={form.email} onChange={e => set("email", e.target.value)} placeholder="contato@empresa.com.br" /></div>
            <div><label style={lbl}>Telefone</label><input style={inp} value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" /></div>
          </div>
          <div><label style={lbl}>Obra / Projeto</label><input style={inp} value={form.obra} onChange={e => set("obra", e.target.value)} placeholder="Ex: Edifício comercial 12 andares" /></div>
          <div style={row2}>
            <div>
              <label style={lbl}>Etapa do funil</label>
              <select style={{ ...inp }} value={form.etapa} onChange={e => set("etapa", e.target.value)}>
                {ETAPAS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Prioridade</label>
              <select style={{ ...inp }} value={form.prioridade} onChange={e => set("prioridade", e.target.value)}>
                {["Alta", "Média", "Baixa"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Origem</label>
            <select style={{ ...inp }} value={form.origem} onChange={e => set("origem", e.target.value)}>
              {["Site", "Indicação", "LinkedIn", "Google Ads", "WhatsApp", "Evento", "Outro"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div><label style={lbl}>Notas</label><textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={form.notas} onChange={e => set("notas", e.target.value)} placeholder="Anotações sobre o lead..." /></div>
        </div>

        <div style={{ padding: "14px 24px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 7, padding: "8px 18px", cursor: "pointer", fontSize: 13 }}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ background: C.orange, border: "none", color: "#fff", borderRadius: 7, padding: "8px 20px", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Salvando..." : isNew ? "Criar lead" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Painel lateral ───────────────────────────────────────────────────
function DetailPanel({
  lead,
  deal,
  profiles,
  dealPatchSaving,
  onPatchDeal,
  dealActivities,
  dealActivitiesLoading,
  dealActivitiesError,
  activityFilters,
  onActivityFiltersChange,
  activityDraft,
  onActivityDraftChange,
  onCreateActivity,
  onToggleActivityDone,
  activitySaving,
  onClose,
  onEdit,
  onDelete,
}) {
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const ec = EC[lead.etapa] || { bg: C.faint, text: C.muted };
  const pc = PC[lead.prioridade] || { bg: C.faint, text: C.muted };
  const health = computeHealth(deal);
  const healthMeta = HEALTH_META[health.level];
  const openActivities = dealActivities.filter((activity) => !activity.done);
  const overdueActivities = openActivities.filter((activity) => isBeforeToday(activity.due_at));
  const nextDue = deal?.next_activity_at ? fmtDateTime(deal.next_activity_at) : "Sem follow-up";
  const filteredActivities = dealActivities.filter((activity) => {
    const matchesType = !activityFilters.type || activity.type === activityFilters.type;
    const matchesChannel = !activityFilters.channel || activity.channel === activityFilters.channel;
    return matchesType && matchesChannel;
  });
  const groupedActivities = filteredActivities.reduce((acc, activity) => {
    const key = normalizeDateKey(activity.created_at);
    const current = acc.get(key) ?? [];
    current.push(activity);
    acc.set(key, current);
    return acc;
  }, new Map());
  return (
    <div style={{ width: 380, background: C.card, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Detalhes</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}>{Ico.close}</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Avatar name={lead.nome} size={42} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.3 }}>{lead.nome}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{lead.contato}{lead.cargo ? ` · ${lead.cargo}` : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <Badge label={lead.etapa} colors={ec} />
          <Badge label={lead.prioridade} colors={pc} />
          <Badge label={lead.origem} colors={{ bg: C.faint, text: C.muted }} />
        </div>
        <div style={{ background: C.faint, borderRadius: 12, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Valor potencial</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.orange }}>{fmt(lead.valor)}</div>
        </div>
        {lead.email && (
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
            Email: <span style={{ color: C.text }}>{lead.email}</span>
          </div>
        )}
        {lead.telefone && (
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>
            Telefone: <span style={{ color: C.text }}>{lead.telefone}</span>
          </div>
        )}
        {lead.obra && (
          <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}`, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Projeto</div>
            <div style={{ fontSize: 13, color: C.text }}>{lead.obra}</div>
          </div>
        )}
        <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Última atividade</div>
          <div style={{ fontSize: 13, color: C.text }}>{fmtDate(lead.ultima_atividade)}</div>
        </div>
        {lead.notas && (
          <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 5, fontWeight: 600, textTransform: "uppercase" }}>Notas</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{lead.notas}</div>
          </div>
        )}
      </div>
      {deal ? (
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 4 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Negócio vinculado
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            <Badge label={formatDealStage(deal.stage)} colors={DEAL_STAGE_META[deal.stage] || { bg: C.faint, text: C.muted }} />
            <Badge label={deal.status === "ganho" ? "Ganho" : deal.status === "perdido" ? "Perdido" : "Aberto"} colors={{ bg: deal.status === "ganho" ? "#0F2A1A" : deal.status === "perdido" ? "#2A0F0F" : C.faint, text: deal.status === "ganho" ? "#22C55E" : deal.status === "perdido" ? "#EF4444" : C.muted }} />
            <Badge label={deal.priority === "alta" ? "Prioridade alta" : deal.priority === "baixa" ? "Prioridade baixa" : "Prioridade média"} colors={PC[deal.priority === "alta" ? "Alta" : deal.priority === "baixa" ? "Baixa" : "Média"]} />
          </div>
          <div style={{ background: C.faint, borderRadius: 10, padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600, textTransform: "uppercase" }}>Resumo</div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 700, marginBottom: 4 }}>{deal.company_name || deal.nome}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{deal.contact_name || lead.contato || "Sem contato principal"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Valor</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.orange }}>{fmt(deal.valor)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Abertas</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{deal.activities_open}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: C.muted }}>
              Próximo follow-up: <span style={{ color: C.text, fontWeight: 600 }}>{nextDue}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>
              Atrasadas: <span style={{ color: overdueActivities.length > 0 ? C.red : C.text, fontWeight: 600 }}>{overdueActivities.length}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>
              Saúde:{" "}
              <span style={{ background: healthMeta.bg, color: healthMeta.text, fontWeight: 700, borderRadius: 999, padding: "2px 8px" }}>
                {healthMeta.label} · {health.score}
              </span>
            </div>
          </div>

          <div style={{ marginBottom: 14, display: "grid", gap: 8 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Operação comercial
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <select
                value={deal.stage}
                onChange={(e) => onPatchDeal({ stage: e.target.value })}
                disabled={dealPatchSaving}
                style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "8px 10px", fontSize: 12, outline: "none" }}
              >
                {DEAL_STAGES.map((stage) => (
                  <option key={stage} value={stage}>{formatDealStage(stage)}</option>
                ))}
              </select>
              <select
                value={deal.owner_profile_id || ""}
                onChange={(e) => onPatchDeal({ owner_profile_id: e.target.value || null })}
                disabled={dealPatchSaving}
                style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "8px 10px", fontSize: 12, outline: "none" }}
              >
                <option value="">Sem responsável</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.nome || profile.email}</option>
                ))}
              </select>
            </div>
            {(deal.stage === "perdido" || deal.status === "perdido") ? (
              <input
                value={deal.loss_reason || ""}
                onChange={(e) => onPatchDeal({ loss_reason: e.target.value })}
                placeholder="Motivo de perda (obrigatório)"
                disabled={dealPatchSaving}
                style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "8px 10px", fontSize: 12, outline: "none" }}
              />
            ) : null}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Playbook da etapa
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {(deal.playbook_items || []).map((item) => (
                <label key={item.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: C.text }}>
                  <input
                    type="checkbox"
                    checked={Boolean(item.done)}
                    onChange={(e) => {
                      const next = (deal.playbook_items || []).map((current) => current.id === item.id ? { ...current, done: e.target.checked } : current);
                      onPatchDeal({ playbook_items: next });
                    }}
                    disabled={dealPatchSaving}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Campos customizados
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {Object.entries(deal.custom_fields || {}).map(([key, value]) => (
                <div key={key} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6 }}>
                  <input value={key} readOnly style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.muted, padding: "7px 10px", fontSize: 12, outline: "none" }} />
                  <input value={value} readOnly style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "7px 10px", fontSize: 12, outline: "none" }} />
                  <button
                    type="button"
                    onClick={() => {
                      const next = { ...(deal.custom_fields || {}) };
                      delete next[key];
                      onPatchDeal({ custom_fields: next });
                    }}
                    disabled={dealPatchSaving}
                    style={{ background: "#2A0F0F", border: "1px solid #3A1515", color: C.red, borderRadius: 12, padding: "0 10px", fontSize: 12, cursor: "pointer" }}
                  >
                    x
                  </button>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6 }}>
                <input value={customKey} onChange={(e) => setCustomKey(e.target.value)} placeholder="Campo" style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "7px 10px", fontSize: 12, outline: "none" }} />
                <input value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder="Valor" style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "7px 10px", fontSize: 12, outline: "none" }} />
                <button
                  type="button"
                  onClick={() => {
                    if (!customKey.trim()) return;
                    onPatchDeal({ custom_fields: { ...(deal.custom_fields || {}), [customKey.trim()]: customValue.trim() } });
                    setCustomKey("");
                    setCustomValue("");
                  }}
                  disabled={dealPatchSaving}
                  style={{ background: C.orange, border: "none", color: "#fff", borderRadius: 12, padding: "0 10px", fontSize: 12, cursor: "pointer" }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Nova atividade
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <input
                value={activityDraft.subject}
                onChange={(e) => onActivityDraftChange("subject", e.target.value)}
                placeholder="Assunto do follow-up"
                style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "9px 12px", fontSize: 13, outline: "none" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                <select
                  value={activityDraft.type}
                  onChange={(e) => onActivityDraftChange("type", e.target.value)}
                  style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "9px 12px", fontSize: 13, outline: "none" }}
                >
                  {ACTIVITY_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <select
                  value={activityDraft.channel}
                  onChange={(e) => onActivityDraftChange("channel", e.target.value)}
                  style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "9px 12px", fontSize: 13, outline: "none" }}
                >
                  {ACTIVITY_CHANNELS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <input
                type="datetime-local"
                value={activityDraft.due_at}
                onChange={(e) => onActivityDraftChange("due_at", e.target.value)}
                style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "9px 12px", fontSize: 13, outline: "none" }}
              />
              <textarea
                value={activityDraft.body}
                onChange={(e) => onActivityDraftChange("body", e.target.value)}
                placeholder="Observações, próximos passos e contexto"
                rows={3}
                style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "9px 12px", fontSize: 13, outline: "none", resize: "vertical" }}
              />
              <button
                type="button"
                onClick={onCreateActivity}
                disabled={activitySaving}
                style={{ background: C.orange, border: "none", color: "#fff", borderRadius: 12, padding: "10px 14px", cursor: activitySaving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, opacity: activitySaving ? 0.75 : 1 }}
              >
                {activitySaving ? "Salvando atividade..." : "Registrar follow-up"}
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    onActivityDraftChange("type", "call");
                    onActivityDraftChange("channel", "whatsapp");
                    onActivityDraftChange("subject", activityDraft.subject || "Contato via WhatsApp");
                    onCreateActivity();
                    if (lead.telefone) {
                      window.open(`https://wa.me/${String(lead.telefone).replace(/\D/g, "")}`, "_blank", "noopener,noreferrer");
                    }
                  }}
                  disabled={activitySaving}
                  style={{ flex: 1, background: "#103021", border: "1px solid #1F5130", color: "#22C55E", borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >
                  WhatsApp + log
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onActivityDraftChange("type", "email");
                    onActivityDraftChange("channel", "email");
                    onActivityDraftChange("subject", activityDraft.subject || "Contato por e-mail");
                    onCreateActivity();
                    if (lead.email) {
                      window.open(`mailto:${lead.email}`, "_blank", "noopener,noreferrer");
                    }
                  }}
                  disabled={activitySaving}
                  style={{ flex: 1, background: "#1A2035", border: "1px solid #2A3A64", color: "#7DB6FF", borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >
                  E-mail + log
                </button>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Linha do tempo
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <select
                value={activityFilters.type}
                onChange={(e) => onActivityFiltersChange("type", e.target.value)}
                style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "8px 10px", fontSize: 12, outline: "none" }}
              >
                <option value="">Todos os tipos</option>
                {ACTIVITY_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <select
                value={activityFilters.channel}
                onChange={(e) => onActivityFiltersChange("channel", e.target.value)}
                style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "8px 10px", fontSize: 12, outline: "none" }}
              >
                <option value="">Todos os canais</option>
                {ACTIVITY_CHANNELS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>
            {dealActivitiesLoading ? (
              <div style={{ fontSize: 13, color: C.muted }}>Carregando atividades...</div>
            ) : dealActivitiesError ? (
              <div style={{ fontSize: 13, color: C.red }}>{dealActivitiesError}</div>
            ) : filteredActivities.length === 0 ? (
              <div style={{ fontSize: 13, color: C.muted }}>Sem atividades registradas para este negócio.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {[...groupedActivities.entries()].map(([day, activities]) => (
                  <div key={day}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontWeight: 700 }}>{day === "Sem data" ? day : new Date(`${day}T00:00:00`).toLocaleDateString("pt-BR")}</div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {activities.map((activity) => (
                        <div key={activity.id} style={{ border: `1px solid ${C.border}`, borderRadius: 10, padding: 10, background: C.faint }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{ACTIVITY_TYPE_ICON[activity.type] || "•"} {activity.subject}</div>
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                                {formatActivityType(activity.type)} · {activity.channel}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onToggleActivityDone(activity)}
                              style={{ background: activity.done ? "#0F2A1A" : "none", border: `1px solid ${activity.done ? "#1F5130" : C.border}`, color: activity.done ? "#22C55E" : C.muted, borderRadius: 999, padding: "4px 8px", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }}
                            >
                              {activity.done ? "Concluída" : "Marcar concluída"}
                            </button>
                          </div>
                          {activity.body ? <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 6 }}>{activity.body}</div> : null}
                          <div style={{ fontSize: 11, color: C.muted, display: "flex", justifyContent: "space-between", gap: 8 }}>
                            <span>Prazo: {activity.due_at ? fmtDateTime(activity.due_at) : "Sem prazo"}</span>
                            <span>{activity.done ? `Finalizada em ${activity.completed_at ? fmtDateTime(activity.completed_at) : "—"}` : `Criada em ${fmtDateTime(activity.created_at)}`}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
      <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, display: "flex", gap: 8 }}>
        <button onClick={() => onEdit(lead)} style={{ flex: 1, background: C.faint, border: `1px solid ${C.border}`, color: C.text, borderRadius: 7, padding: "8px 0", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {Ico.edit} Editar
        </button>
        <button onClick={() => { onDelete(lead.id); onClose(); }} style={{ background: "#2A0F0F", border: "1px solid #3A1515", color: C.red, borderRadius: 7, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>
          {Ico.trash}
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────
export default function CrmPage() {
  const [leads, setLeads]   = useState([]);
  const [deals, setDeals]   = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [lossReasons, setLossReasons] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceColor, setNewWorkspaceColor] = useState("#3B82F6");
  const [customTabs, setCustomTabs] = useState([]);
  const [selectedTab, setSelectedTab] = useState(null);
  const [showNewTab, setShowNewTab] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [newTabColor, setNewTabColor] = useState("#3B82F6");
  const [view, setView]     = useState("kanban");
  const [search, setSearch] = useState("");
  const [fEtapa, setFEtapa] = useState("");
  const [fPrio, setFPrio]   = useState("");
  const [fOrigem, setFOrigem] = useState("");
  const [fOwner, setFOwner] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState("");
  const [editingLead, setEditingLead] = useState(null);   // { lead } = editar | { etapaInicial } = novo
  const [saving, setSaving] = useState(false);
  const [dealPatchSaving, setDealPatchSaving] = useState(false);
  const [dealActivities, setDealActivities] = useState([]);
  const [dealActivitiesLoading, setDealActivitiesLoading] = useState(false);
  const [dealActivitiesError, setDealActivitiesError] = useState("");
  const [activitySaving, setActivitySaving] = useState(false);
  const [activityFilters, setActivityFilters] = useState({ type: "", channel: "" });
  const [activityDraft, setActivityDraft] = useState({
    type: "follow_up",
    subject: "",
    body: "",
    channel: "whatsapp",
    due_at: `${today()}T09:00`,
  });

  const refreshDeals = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/deals", { method: "GET", headers: { Accept: "application/json" } });
      const data = await res.json();
      if (res.ok && data?.ok && Array.isArray(data.deals)) {
        setDeals(data.deals);
      }
    } catch {
      // noop: painel de deals é complementar
    }
  }, []);

  const refreshLossReasons = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/loss-reasons", { method: "GET", headers: { Accept: "application/json" } });
      const data = await res.json();
      if (res.ok && data?.ok && Array.isArray(data.reasons)) {
        setLossReasons(data.reasons);
      }
    } catch {
      // noop
    }
  }, []);

  const loadCustomTabs = useCallback(async (workspaceId) => {
    try {
      const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
      const res = await fetch(`/api/crm/tabs${query}`, { method: "GET", headers: { Accept: "application/json" } });
      const data = await res.json();
      if (res.ok && data?.success && Array.isArray(data.data)) {
        setCustomTabs(data.data);
        setSelectedTab(null);
      }
    } catch {
      // noop
    }
  }, []);

  const selectedDeal = useMemo(() => {
    if (!selected) return null;
    return deals.find((deal) => Array.isArray(deal.tags) && deal.tags.includes(`lead:${selected.id}`)) || null;
  }, [selected, deals]);
  const selectedDealId = selectedDeal?.id ?? null;

  const dealSummary = useMemo(() => {
    const openDeals = deals.filter((deal) => deal.status === "aberto");
    const wonDeals = deals.filter((deal) => deal.status === "ganho");
    const lostDeals = deals.filter((deal) => deal.status === "perdido");
    const dueToday = openDeals.filter((deal) => isToday(deal.next_activity_at));
    const overdue = openDeals.filter((deal) => isBeforeToday(deal.next_activity_at));
    const openActivities = deals.reduce((sum, deal) => sum + (Number(deal.activities_open) || 0), 0);
    const forecast = openDeals.reduce((sum, deal) => sum + ((Number(deal.valor) || 0) * ((Number(deal.probability) || 0) / 100)), 0);
    const baseDayTs = new Date(`${today()}T00:00:00`).getTime();
    const avgAgingDays = openDeals.length
      ? Math.round(openDeals.reduce((sum, deal) => {
        const date = deal.last_activity_at ? new Date(deal.last_activity_at) : null;
        if (!date || Number.isNaN(date.getTime())) return sum + 30;
        const diffMs = baseDayTs - date.getTime();
        return sum + Math.max(0, Math.round(diffMs / 86400000));
      }, 0) / openDeals.length)
      : 0;
    const stageTotals = DEAL_STAGES.map((stage) => ({
      stage,
      label: formatDealStage(stage),
      count: deals.filter((deal) => deal.stage === stage).length,
      value: deals.filter((deal) => deal.stage === stage).reduce((sum, deal) => sum + (Number(deal.valor) || 0), 0),
      meta: DEAL_STAGE_META[stage],
    }));
    return { openDeals, wonDeals, lostDeals, dueToday, overdue, openActivities, stageTotals, forecast, avgAgingDays };
  }, [deals]);

  // ── Drag state ──
  const [dragState, setDragState] = useState({ draggingId: null, overCol: null });
  const draggingId = useRef(null);

  const handleDragStart = useCallback(id => {
    draggingId.current = id;
    setDragState(s => ({ ...s, draggingId: id }));
  }, []);

  useEffect(() => {
    let active = true;
    const loadActivities = async () => {
      if (!selectedDealId) {
        setDealActivities([]);
        setDealActivitiesError("");
        setDealActivitiesLoading(false);
        return;
      }

      setDealActivitiesLoading(true);
      setDealActivitiesError("");
      try {
        const res = await fetch(`/api/crm/deals/${selectedDealId}/activities`, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        if (!active) return;
        if (res.ok && data?.ok && Array.isArray(data.activities)) {
          setDealActivities(data.activities);
        } else {
          setDealActivities([]);
          setDealActivitiesError(data?.message || "Falha ao carregar atividades do negócio.");
        }
      } catch {
        if (!active) return;
        setDealActivities([]);
        setDealActivitiesError("Falha de conectividade ao carregar atividades.");
      } finally {
        if (active) setDealActivitiesLoading(false);
      }
    };
    loadActivities();
    return () => {
      active = false;
    };
  }, [selectedDealId]);

  const handleDragEnd = useCallback(() => {
    draggingId.current = null;
    setDragState({ draggingId: null, overCol: null });
  }, []);

  const handleDragOver = useCallback(etapa => {
    setDragState(s => s.overCol === etapa ? s : { ...s, overCol: etapa });
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [leadsRes, dealsRes, profilesRes, reasonsRes, workspacesRes] = await Promise.all([
          fetch("/api/crm/leads", { method: "GET", headers: { Accept: "application/json" } }),
          fetch("/api/crm/deals", { method: "GET", headers: { Accept: "application/json" } }),
          fetch("/api/crm/profiles", { method: "GET", headers: { Accept: "application/json" } }),
          fetch("/api/crm/loss-reasons", { method: "GET", headers: { Accept: "application/json" } }),
          fetch("/api/crm/workspaces", { method: "GET", headers: { Accept: "application/json" } }),
        ]);
        const data = await leadsRes.json();
        const dealsData = await dealsRes.json();
        const profilesData = await profilesRes.json();
        const reasonsData = await reasonsRes.json();
        const workspacesData = await workspacesRes.json();
        if (!active) return;
        if (!leadsRes.ok || !data?.ok) {
          setLeads([]);
          setDeals([]);
          setProfiles([]);
          setLossReasons([]);
          setWorkspaces([]);
          setSyncError(data?.message || "Falha ao carregar tarefas reais para o CRM.");
        } else {
          setLeads(Array.isArray(data.leads) ? data.leads : []);
          setDeals(dealsRes.ok && dealsData?.ok && Array.isArray(dealsData.deals) ? dealsData.deals : []);
          setProfiles(profilesRes.ok && profilesData?.ok && Array.isArray(profilesData.profiles) ? profilesData.profiles : []);
          setLossReasons(reasonsRes.ok && reasonsData?.ok && Array.isArray(reasonsData.reasons) ? reasonsData.reasons : []);
          if (workspacesRes.ok && workspacesData?.success && Array.isArray(workspacesData.data)) {
            setWorkspaces(workspacesData.data);
            if (workspacesData.data.length > 0) {
              const firstWorkspaceId = workspacesData.data[0].id;
              setSelectedWorkspace(firstWorkspaceId);
              loadCustomTabs(firstWorkspaceId);
            }
          }
          setSyncError("");
        }
      } catch {
        if (!active) return;
        setLeads([]);
        setDeals([]);
        setProfiles([]);
        setLossReasons([]);
        setWorkspaces([]);
        setSyncError("Falha de conectividade com API CRM.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [loadCustomTabs]);

  const handleDrop = useCallback(async (targetEtapa) => {
    const id = draggingId.current;
    setDragState({ draggingId: null, overCol: null });
    if (!id) return;
    const lead = leads.find(l => String(l.id) === String(id));
    if (!lead || lead.etapa === targetEtapa) return;
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, etapa: targetEtapa } : l));
    try {
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ etapa: targetEtapa }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setLeads(prev => prev.map(l => l.id === lead.id ? data.lead : l));
        refreshDeals();
        setSyncError("");
      } else {
        setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
        setSyncError(data?.message || "Erro ao mover lead.");
      }
    } catch {
      setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
      setSyncError("Erro de conexão ao mover lead.");
    }
  }, [leads, refreshDeals]);

  const handleActivityDraftChange = useCallback((field, value) => {
    setActivityDraft((current) => ({ ...current, [field]: value }));
  }, []);

  const handleActivityFiltersChange = useCallback((field, value) => {
    setActivityFilters((current) => ({ ...current, [field]: value }));
  }, []);

  const handlePatchSelectedDeal = useCallback(async (patch) => {
    if (!selectedDealId) return;
    setDealPatchSaving(true);
    setDealActivitiesError("");
    try {
      const res = await fetch(`/api/crm/deals/${selectedDealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setDealActivitiesError(data?.message || "Falha ao atualizar negócio.");
        return;
      }
      await refreshDeals();
      await refreshLossReasons();
    } catch {
      setDealActivitiesError("Erro de conectividade ao atualizar negócio.");
    } finally {
      setDealPatchSaving(false);
    }
  }, [refreshDeals, refreshLossReasons, selectedDealId]);

  const handleRunAutomation = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/deals", { method: "POST", headers: { Accept: "application/json" } });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setSyncError(data?.message || "Falha ao executar automações de follow-up.");
        return;
      }
      await refreshDeals();
      setSyncError("");
    } catch {
      setSyncError("Erro de conexão ao executar automações de follow-up.");
    }
  }, [refreshDeals]);

  const loadSelectedDealActivities = useCallback(async () => {
    if (!selectedDealId) return;
    const res = await fetch(`/api/crm/deals/${selectedDealId}/activities`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    if (res.ok && data?.ok && Array.isArray(data.activities)) {
      setDealActivities(data.activities);
      return data.activities;
    }
    throw new Error(data?.message || "Falha ao recarregar atividades.");
  }, [selectedDealId]);

  // ── Filtered ──
  const filtered = useMemo(() => leads.filter(l => {
    const linkedDeal = deals.find((deal) => Array.isArray(deal.tags) && deal.tags.includes(`lead:${l.id}`));
    const q = search.toLowerCase();
    return (!q || l.nome.toLowerCase().includes(q) || l.contato.toLowerCase().includes(q) || (l.obra || "").toLowerCase().includes(q))
      && (!fEtapa || l.etapa === fEtapa)
      && (!fPrio  || l.prioridade === fPrio)
      && (!fOrigem || l.origem === fOrigem)
      && (!fOwner || linkedDeal?.owner_profile_id === fOwner);
  }), [leads, deals, search, fEtapa, fPrio, fOrigem, fOwner]);

  // ── Métricas ──
  const fechados  = filtered.filter(l => l.etapa === "Fechado");
  const abertos   = filtered.filter(l => !["Fechado", "Perdido"].includes(l.etapa));
  const totalVal  = abertos.reduce((a, l) => a + l.valor, 0);   // pipeline ativo
  const taxa      = filtered.length ? Math.round(fechados.length / filtered.length * 100) : 0;

  // ── Handlers CRUD ──
  const handleSaveLead = useCallback(async (formData) => {
    setSaving(true);
    setSyncError("");
    const isEdit = !!formData.id && !String(formData.id).match(/^\d{13}$/); // real uuid vs Date.now()
    try {
      const url = isEdit ? `/api/crm/leads/${formData.id}` : "/api/crm/leads";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        if (isEdit) {
          setLeads(prev => prev.map(l => l.id === data.lead.id ? data.lead : l));
          if (selected?.id === data.lead.id) setSelected(data.lead);
        } else {
          setLeads(prev => [...prev, data.lead]);
        }
        refreshDeals();
        setEditingLead(null);
      } else {
        setSyncError(data?.message || "Erro ao salvar lead.");
      }
    } catch {
      setSyncError("Erro de conexão ao salvar lead.");
    } finally {
      setSaving(false);
    }
  }, [selected, refreshDeals]);

  const handleDeleteLead = useCallback(async (id) => {
    if (!confirm("Remover este lead do CRM?")) return;
    try {
      const res = await fetch(`/api/crm/leads/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data?.ok) {
        setLeads(prev => prev.filter(l => l.id !== id));
        setSelected(s => s?.id === id ? null : s);
        refreshDeals();
        setSyncError("");
      } else {
        setSyncError(data?.message || "Erro ao remover lead.");
      }
    } catch {
      setSyncError("Erro de conexão ao remover lead.");
    }
  }, [refreshDeals]);

  const handleCreateActivity = useCallback(async (event) => {
    event?.preventDefault?.();
    if (!selectedDealId) return;
    if (!activityDraft.subject.trim()) {
      setDealActivitiesError("Informe um assunto para a atividade.");
      return;
    }
    setActivitySaving(true);
    setDealActivitiesError("");
    try {
      const res = await fetch(`/api/crm/deals/${selectedDealId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activityDraft),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        await refreshDeals();
        await loadSelectedDealActivities();
        setActivityDraft((current) => ({
          ...current,
          subject: "",
          body: "",
          due_at: `${today()}T09:00`,
        }));
      } else {
        setDealActivitiesError(data?.message || "Erro ao criar atividade.");
      }
    } catch {
      setDealActivitiesError("Erro de conexão ao criar atividade.");
    } finally {
      setActivitySaving(false);
    }
  }, [activityDraft, loadSelectedDealActivities, refreshDeals, selectedDealId]);

  const handleToggleActivityDone = useCallback(async (activity) => {
    setActivitySaving(true);
    setDealActivitiesError("");
    try {
      const res = await fetch(`/api/crm/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !activity.done }),
      });
      const data = await res.json();
      if (res.ok && data?.ok) {
        await refreshDeals();
        await loadSelectedDealActivities();
      } else {
        setDealActivitiesError(data?.message || "Erro ao atualizar atividade.");
      }
    } catch {
      setDealActivitiesError("Erro de conexão ao atualizar atividade.");
    } finally {
      setActivitySaving(false);
    }
  }, [loadSelectedDealActivities, refreshDeals]);

  const btnToggle = (active) => ({
    background: active ? C.orange : "none",
    border: `1px solid ${active ? C.orange : C.border}`,
    color: active ? "#fff" : C.muted,
    borderRadius: 12, padding: "7px 12px", cursor: "pointer",
    fontSize: 13, display: "flex", alignItems: "center", gap: 6,
  });

  const selStyle = {
    background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12,
    color: C.text, padding: "7px 10px", fontSize: 13, cursor: "pointer", outline: "none",
  };

  return (
    <div className="of-crm-fullbleed" style={{ background: "transparent", minHeight: "100%", color: C.text, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      {loading && (
        <div style={{ background: C.surface, color: C.muted, fontSize: 12, padding: "8px 24px", borderBottom: `1px solid ${C.border}` }}>
          Carregando leads do CRM...
        </div>
      )}
      {!loading && syncError && (
        <div style={{ background: "#2A1A0A", color: "#FFB37F", fontSize: 12, padding: "8px 24px", borderBottom: `1px solid ${C.border}` }}>
          {syncError}
        </div>
      )}

      {/* ── Workspaces (Abas de contexto) ── */}
      <div role="tablist" aria-label="Abas de contexto do CRM" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            role="tab"
            aria-selected={selectedWorkspace === ws.id}
            tabIndex={0}
            onClick={() => {
              setSelectedWorkspace(ws.id);
              loadCustomTabs(ws.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedWorkspace(ws.id);
                loadCustomTabs(ws.id);
              }
            }}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              borderBottom: selectedWorkspace === ws.id ? `3px solid ${ws.color}` : `3px solid transparent`,
              color: selectedWorkspace === ws.id ? C.text : C.muted,
              fontSize: 13,
              fontWeight: selectedWorkspace === ws.id ? 600 : 500,
              transition: "all .15s",
              whiteSpace: "nowrap",
              userSelect: "none",
              background: selectedWorkspace === ws.id ? `${ws.color}15` : "transparent",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
            onMouseLeave={e => { e.currentTarget.style.color = selectedWorkspace === ws.id ? C.text : C.muted; }}
          >
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: ws.color, marginRight: 8, verticalAlign: "middle" }}></span>
            {ws.name}
          </div>
        ))}
        <button
          onClick={() => setShowNewWorkspace(true)}
          aria-label="Criar nova aba de contexto"
          style={{
            padding: "12px 16px",
            border: "none",
            background: "transparent",
            color: C.muted,
            cursor: "pointer",
            fontSize: 13,
            marginLeft: "auto",
            flexShrink: 0,
            transition: "all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = C.orange; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; }}
        >
          {Ico.plus} Nova aba
        </button>
      </div>

      {/* ── Modal: Criar novo workspace ── */}
      {showNewWorkspace && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewWorkspace(false); }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: "100%", maxWidth: 400, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Nova aba de contexto</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4, fontWeight: 500 }}>Nome da aba *</label>
              <input
                value={newWorkspaceName}
                onChange={e => setNewWorkspaceName(e.target.value)}
                placeholder="Ex: Vendas, Operacional, Engenharia..."
                style={{ width: "100%", background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4, fontWeight: 500 }}>Cor</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"].map((color) => (
                  <div
                    key={color}
                    onClick={() => setNewWorkspaceColor(color)}
                    style={{
                      width: "100%",
                      aspectRatio: 1,
                      background: color,
                      borderRadius: 12,
                      cursor: "pointer",
                      border: newWorkspaceColor === color ? `2px solid ${C.text}` : `2px solid ${C.border}`,
                      transition: "all .15s",
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowNewWorkspace(false)}
                style={{ padding: "8px 16px", background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!newWorkspaceName.trim()) return;
                  try {
                    const res = await fetch("/api/crm/workspaces", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: newWorkspaceName, color: newWorkspaceColor }),
                    });
                    const data = await res.json();
                    if (res.ok && data?.success) {
                      setWorkspaces([...workspaces, data.data]);
                      setNewWorkspaceName("");
                      setNewWorkspaceColor("#3B82F6");
                      setShowNewWorkspace(false);
                      setSelectedWorkspace(data.data.id);
                    }
                  } catch {}
                }}
                style={{ padding: "8px 16px", background: C.orange, border: `1px solid ${C.orange}`, borderRadius: 12, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
              >
                Criar aba
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Tabs (Cards personalizados por filtros) ── */}
      {selectedWorkspace && customTabs.length > 0 && (
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
          {customTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => {
                setSelectedTab(tab.id === selectedTab ? null : tab.id);
                if (tab.id !== selectedTab) {
                  setFEtapa(tab.filter_etapa?.join(",") || "");
                  setFPrio(tab.filter_prioridade?.join(",") || "");
                  setFOrigem(tab.filter_origem?.join(",") || "");
                  setFOwner(tab.filter_owner_id || "");
                  setSearch(tab.search || "");
                }
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: selectedTab === tab.id ? `2px solid ${tab.color || "#3B82F6"}` : `2px solid transparent`,
                color: selectedTab === tab.id ? C.text : C.muted,
                fontSize: 12,
                fontWeight: selectedTab === tab.id ? 600 : 500,
                transition: "all .15s",
                whiteSpace: "nowrap",
                userSelect: "none",
                background: selectedTab === tab.id ? `${tab.color || "#3B82F6"}10` : "transparent",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={e => { e.currentTarget.style.color = selectedTab === tab.id ? C.text : C.muted; }}
            >
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: tab.color || "#3B82F6", marginRight: 6, verticalAlign: "middle" }}></span>
              {tab.name}
            </div>
          ))}
          <button
            onClick={() => setShowNewTab(true)}
            style={{
              padding: "8px 12px",
              border: "none",
              background: "transparent",
              color: C.muted,
              cursor: "pointer",
              fontSize: 12,
              marginLeft: "auto",
              flexShrink: 0,
              transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.orange; }}
            onMouseLeave={e => { e.currentTarget.style.color = C.muted; }}
          >
            {Ico.plus} Nova tab
          </button>
        </div>
      )}

      {/* ── Modal: Criar nova custom tab ── */}
      {showNewTab && selectedWorkspace && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewTab(false); }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, width: "100%", maxWidth: 400, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Nova tab de filtros</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4, fontWeight: 500 }}>Nome da tab *</label>
              <input
                value={newTabName}
                onChange={e => setNewTabName(e.target.value)}
                placeholder="Ex: Leads Quentes, Follow-ups Urgentes..."
                style={{ width: "100%", background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, padding: "8px 12px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: C.muted, display: "block", marginBottom: 4, fontWeight: 500 }}>Cor</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"].map((color) => (
                  <div
                    key={color}
                    onClick={() => setNewTabColor(color)}
                    style={{
                      width: "100%",
                      aspectRatio: 1,
                      background: color,
                      borderRadius: 12,
                      cursor: "pointer",
                      border: newTabColor === color ? `2px solid ${C.text}` : `2px solid ${C.border}`,
                      transition: "all .15s",
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, padding: 10, background: C.faint, borderRadius: 8 }}>
              Esta tab será criada com os filtros atuais (etapa, prioridade, origem, responsável).
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowNewTab(false)}
                style={{ padding: "8px 16px", background: C.faint, border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!newTabName.trim()) return;
                  try {
                    const res = await fetch("/api/crm/tabs", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: newTabName,
                        color: newTabColor,
                        filter_etapa: fEtapa ? fEtapa.split(",") : [],
                        filter_prioridade: fPrio ? fPrio.split(",") : [],
                        filter_origem: fOrigem ? fOrigem.split(",") : [],
                        filter_owner_id: fOwner,
                        search: search,
                        workspace_id: selectedWorkspace,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok && data?.success) {
                      setCustomTabs([...customTabs, data.data]);
                      setNewTabName("");
                      setNewTabColor("#3B82F6");
                      setShowNewTab(false);
                      setSelectedTab(data.data.id);
                    }
                  } catch {}
                }}
                style={{ padding: "8px 16px", background: C.orange, border: `1px solid ${C.orange}`, borderRadius: 12, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
              >
                Criar tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Métricas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: C.border }}>
        {[
          { label: "Pipeline ativo",    value: fmt(totalVal),   sub: `${abertos.length} leads em aberto`,  accent: true },
          { label: "Em negociação",     value: abertos.length,  sub: fmt(totalVal) + " potencial" },
          { label: "Fechados",          value: fechados.length, sub: fmt(fechados.reduce((a,l)=>a+l.valor,0)) + " convertidos" },
          { label: "Taxa conversão",    value: `${taxa}%`,      sub: "leads → clientes" },
        ].map((m, i) => (
          <div key={i} style={{ background: C.surface, padding: "14px 20px" }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: i === 0 ? C.orange : C.text }}>{m.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "10px 24px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: C.muted }}>{Ico.search}</span>
          <input value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar empresa, contato ou obra"
            placeholder="Buscar empresa, contato, obra..."
            style={{ width: "100%", background: C.faint, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 12px 8px 32px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={fEtapa} onChange={e => setFEtapa(e.target.value)} aria-label="Filtrar por etapa" style={{ ...selStyle, minWidth: 140 }}>
          <option value="">Todas as etapas</option>
          {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={fPrio} onChange={e => setFPrio(e.target.value)} aria-label="Filtrar por prioridade" style={{ ...selStyle, minWidth: 140 }}>
          <option value="">Todas as prioridades</option>
          {["Alta", "Média", "Baixa"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={fOrigem} onChange={e => setFOrigem(e.target.value)} aria-label="Filtrar por origem" style={{ ...selStyle, minWidth: 160 }}>
          <option value="">Todas as origens</option>
          {[...new Set(leads.map((lead) => lead.origem).filter(Boolean))].sort().map((origem) => (
            <option key={origem} value={origem}>{origem}</option>
          ))}
        </select>
        <select value={fOwner} onChange={e => setFOwner(e.target.value)} style={{ ...selStyle, minWidth: 180 }}>
          <option value="">Toda a carteira</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>{profile.nome || profile.email}</option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <button
            onClick={handleRunAutomation}
            style={{ ...btnToggle(false), borderColor: C.blue, color: C.blue }}
          >
            {Ico.plus} Rodar automações
          </button>
          <button
            onClick={() => setEditingLead({ etapaInicial: "Contato" })}
            style={{ ...btnToggle(false), background: C.orange, borderColor: C.orange, color: "#fff" }}
          >
            {Ico.plus} Novo lead
          </button>
          <button onClick={() => setView("kanban")} style={btnToggle(view === "kanban")}>{Ico.kanban} Kanban</button>
          <button onClick={() => setView("list")}   style={btnToggle(view === "list")}>{Ico.list} Lista</button>
        </div>
      </div>

      {/* ── Pipeline avançado ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 1, background: C.border }}>
        {[
          { label: "Negócios abertos", value: dealSummary.openDeals.length, sub: `${dealSummary.openActivities} atividades pendentes`, accent: C.orange },
          { label: "Follow-ups hoje", value: dealSummary.dueToday.length, sub: "ações com prazo para hoje", accent: C.blue },
          { label: "Atrasados", value: dealSummary.overdue.length, sub: "follow-ups vencidos", accent: C.red },
          { label: "Fechados", value: dealSummary.wonDeals.length, sub: `${dealSummary.lostDeals.length} perdidos`, accent: C.green },
          { label: "Forecast", value: fmt(dealSummary.forecast), sub: "receita ponderada por probabilidade", accent: "#7DB6FF" },
          { label: "Aging médio", value: `${dealSummary.avgAgingDays} dias`, sub: "tempo sem avanço por negócio", accent: C.yellow },
        ].map((item) => (
          <div key={item.label} style={{ background: C.surface, padding: "14px 20px" }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.accent }}>{item.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "14px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          {dealSummary.stageTotals.map((stage) => (
            <div key={stage.stage} style={{ background: C.faint, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stage.label}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: stage.meta.text }}>{stage.count}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{fmt(stage.value)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lossReasons.length > 0 && (
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "10px 24px" }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            Relatório de motivos de perda
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
            {lossReasons.slice(0, 6).map((reason) => (
              <div key={reason.reason} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 12px", background: C.faint }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>{reason.reason}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: C.muted }}>{reason.total} negócios · {fmt(reason.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Negócios enterprise (deals + atividades) ── */}
      {/* ── Content ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minWidth: 0 }}>

          {/* Kanban */}
          {view === "kanban" && (
            <div style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: 8 }}>
              <div style={{ display: "flex", gap: 14, padding: "20px 20px 40px", alignItems: "flex-start", minWidth: "max-content" }}>
                {ETAPAS.map(etapa => (
                  <KanbanColumn
                    key={etapa}
                    etapa={etapa}
                    leads={filtered.filter(l => l.etapa === etapa)}
                    onCardClick={setSelected}
                    onAddCard={card => handleSaveLead({ ...card, id: undefined })}
                    dragState={dragState}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Lista */}
          {view === "list" && (
            <div style={{ padding: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: C.surface }}>
                    {["Empresa", "Contato", "Etapa", "Prioridade", "Valor", "Obra", "Última atividade", "Ações"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => {
                    const ec = EC[lead.etapa] || { bg: C.faint, text: C.muted };
                    const pc = PC[lead.prioridade] || { bg: C.faint, text: C.muted };
                    const isSel = selected?.id === lead.id;
                    return (
                      <tr key={lead.id} onClick={() => setSelected(isSel ? null : lead)}
                        style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: isSel ? C.faint : "transparent", transition: "background .1s" }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "#181818"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isSel ? C.faint : "transparent"; }}>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Avatar name={lead.nome} size={28} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{lead.nome}</span>
                          </div>
                        </td>
                        <td style={{ padding: "11px 14px", fontSize: 13, color: C.muted }}>{lead.contato}</td>
                        <td style={{ padding: "11px 14px" }}><Badge label={lead.etapa} colors={ec} /></td>
                        <td style={{ padding: "11px 14px" }}><Badge label={lead.prioridade} colors={pc} /></td>
                        <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: C.orange }}>{fmt(lead.valor)}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: C.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.obra || "—"}</td>
                        <td style={{ padding: "11px 14px", fontSize: 12, color: C.muted }}>{fmtDate(lead.ultima_atividade)}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => setEditingLead({ lead })} style={{ background: C.faint, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 5, padding: "5px 8px", cursor: "pointer" }}>{Ico.edit}</button>
                            <button onClick={() => handleDeleteLead(lead.id)} style={{ background: "#1A0F0F", border: "1px solid #2A1515", color: C.red, borderRadius: 5, padding: "5px 8px", cursor: "pointer" }}>{Ico.trash}</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: "50px", textAlign: "center", color: C.muted, fontSize: 13 }}>Nenhum lead encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Painel lateral */}
        {selected && (
          <DetailPanel
            lead={selected}
            deal={selectedDeal}
            profiles={profiles}
            dealPatchSaving={dealPatchSaving}
            onPatchDeal={handlePatchSelectedDeal}
            dealActivities={dealActivities}
            dealActivitiesLoading={dealActivitiesLoading}
            dealActivitiesError={dealActivitiesError}
            activityFilters={activityFilters}
            onActivityFiltersChange={handleActivityFiltersChange}
            activityDraft={activityDraft}
            onActivityDraftChange={handleActivityDraftChange}
            onCreateActivity={handleCreateActivity}
            onToggleActivityDone={handleToggleActivityDone}
            activitySaving={activitySaving}
            onClose={() => setSelected(null)}
            onEdit={lead => setEditingLead({ lead })}
            onDelete={handleDeleteLead}
          />
        )}
      </div>

      {/* Modal de criação / edição */}
      {editingLead && (
        <LeadModal
          lead={editingLead.lead ?? null}
          isNew={!editingLead.lead}
          etapaInicial={editingLead.etapaInicial}
          onClose={() => setEditingLead(null)}
          onSave={handleSaveLead}
          saving={saving}
        />
      )}
    </div>
  );
}
