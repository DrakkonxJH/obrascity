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
const today   = () => new Date().toISOString().split("T")[0];

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
    background: C.faint, border: `1px solid ${C.border}`, borderRadius: 6,
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
    <div style={{ background: C.card, border: `1px solid ${C.orange}`, borderRadius: 8, padding: 12 }}>
      <input autoFocus style={inp} placeholder="Nome da empresa *" value={nome} onChange={e => setNome(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onCancel(); }} />
      <input style={inp} placeholder="Contato principal" value={contato} onChange={e => setContato(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onCancel(); }} />
      <input style={{ ...inp, marginBottom: 12 }} placeholder="Valor (R$)" type="number" value={valor} onChange={e => setValor(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onCancel(); }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleAdd} style={{ flex: 1, background: C.orange, border: "none", color: "#fff", borderRadius: 6, padding: "7px 0", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
          Adicionar card
        </button>
        <button onClick={onCancel} style={{ background: C.faint, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6, padding: "7px 12px", cursor: "pointer", fontSize: 13 }}>
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
        borderRadius: 8, padding: 14, cursor: "grab",
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
            style={{ border: `1px dashed ${C.border}`, borderRadius: 8, padding: "18px 14px", textAlign: "center", color: C.muted, fontSize: 12, cursor: "pointer", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.orange; e.currentTarget.style.color = C.orange; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
          >
            + Adicionar lead
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
function LeadModal({ lead, isNew, etapaInicial, onClose, onSave }) {
  const empty = { nome: "", contato: "", cargo: "", email: "", telefone: "", valor: "", etapa: etapaInicial || "Contato", origem: "Site", obra: "", prioridade: "Média", notas: "" };
  const [form, setForm] = useState(lead ? { ...lead } : empty);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = () => onSave({ ...form, id: form.id || Date.now(), ultima_atividade: today(), valor: Number(form.valor) || 0 });

  const inp   = { background: C.faint, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, padding: "9px 12px", fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };
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
          <button onClick={save} style={{ background: C.orange, border: "none", color: "#fff", borderRadius: 7, padding: "8px 20px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
            {isNew ? "Criar lead" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Painel lateral ───────────────────────────────────────────────────
function DetailPanel({ lead, onClose, onEdit, onDelete }) {
  const ec = EC[lead.etapa] || { bg: C.faint, text: C.muted };
  const pc = PC[lead.prioridade] || { bg: C.faint, text: C.muted };
  return (
    <div style={{ width: 320, background: C.card, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
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
        <div style={{ background: C.faint, borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Valor potencial</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.orange }}>{fmt(lead.valor)}</div>
        </div>
        {lead.email   && <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>✉ <span style={{ color: C.text }}>{lead.email}</span></div>}
        {lead.telefone && <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>✆ <span style={{ color: C.text }}>{lead.telefone}</span></div>}
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
  const [view, setView]     = useState("kanban");
  const [search, setSearch] = useState("");
  const [fEtapa, setFEtapa] = useState("");
  const [fPrio, setFPrio]   = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState("");

  // ── Drag state ──
  const [dragState, setDragState] = useState({ draggingId: null, overCol: null });
  const draggingId = useRef(null);

  const handleDragStart = useCallback(id => {
    draggingId.current = id;
    setDragState(s => ({ ...s, draggingId: id }));
  }, []);

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
        const res = await fetch("/api/crm/leads", { method: "GET", headers: { Accept: "application/json" } });
        const data = await res.json();
        if (!active) return;
        if (!res.ok || !data?.ok) {
          setLeads([]);
          setSyncError(data?.message || "Falha ao carregar tarefas reais para o CRM.");
        } else {
          setLeads(Array.isArray(data.leads) ? data.leads : []);
          setSyncError("");
        }
      } catch {
        if (!active) return;
        setLeads([]);
        setSyncError("Falha de conectividade com API CRM.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleDrop = useCallback(() => {
    setDragState({ draggingId: null, overCol: null });
    setSyncError("Movimentação manual desativada. O CRM reflete o status real das tarefas.");
  }, []);

  // ── Filtered ──
  const filtered = useMemo(() => leads.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.nome.toLowerCase().includes(q) || l.contato.toLowerCase().includes(q) || (l.obra || "").toLowerCase().includes(q))
      && (!fEtapa || l.etapa === fEtapa)
      && (!fPrio  || l.prioridade === fPrio);
  }), [leads, search, fEtapa, fPrio]);

  // ── Métricas ──
  const totalVal  = filtered.reduce((a, l) => a + l.valor, 0);
  const fechados  = filtered.filter(l => l.etapa === "Fechado");
  const abertos   = filtered.filter(l => !["Fechado", "Perdido"].includes(l.etapa));
  const taxa      = filtered.length ? Math.round(fechados.length / filtered.length * 100) : 0;

  const btnToggle = (active) => ({
    background: active ? C.orange : "none",
    border: `1px solid ${active ? C.orange : C.border}`,
    color: active ? "#fff" : C.muted,
    borderRadius: 6, padding: "7px 12px", cursor: "pointer",
    fontSize: 13, display: "flex", alignItems: "center", gap: 6,
  });

  const selStyle = {
    background: C.faint, border: `1px solid ${C.border}`, borderRadius: 6,
    color: C.text, padding: "7px 10px", fontSize: 13, cursor: "pointer", outline: "none",
  };

  return (
    <div style={{ background: "transparent", minHeight: "100%", color: C.text, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* ── Header ── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: C.orange, letterSpacing: "-0.02em" }}>🏗 CRM</span>
            <span style={{ color: C.muted, fontSize: 13 }}>/ Pipeline de clientes</span>
          </div>
          <span style={{ color: C.muted, fontSize: 12 }}>Dados sincronizados por tarefas da obra</span>
        </div>
      </div>
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

      {/* ── Métricas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1, background: C.border }}>
        {[
          { label: "Total no funil",    value: fmt(totalVal),   sub: `${filtered.length} leads`,          accent: true },
          { label: "Em aberto",         value: abertos.length,  sub: fmt(abertos.reduce((a,l)=>a+l.valor,0)) + " potencial" },
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar empresa, contato, obra..."
            style={{ width: "100%", background: C.faint, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 12px 8px 32px", color: C.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
        </div>
        <select value={fEtapa} onChange={e => setFEtapa(e.target.value)} style={{ ...selStyle, minWidth: 140 }}>
          <option value="">Todas as etapas</option>
          {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={fPrio} onChange={e => setFPrio(e.target.value)} style={{ ...selStyle, minWidth: 140 }}>
          <option value="">Todas as prioridades</option>
          {["Alta", "Média", "Baixa"].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          <button onClick={() => setView("kanban")} style={btnToggle(view === "kanban")}>{Ico.kanban} Kanban</button>
          <button onClick={() => setView("list")}   style={btnToggle(view === "list")}>{Ico.list} Lista</button>
        </div>
      </div>

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
                    onAddCard={() => setSyncError("Criação manual desativada no CRM sincronizado por tarefas.")}
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
                            <button onClick={() => setSyncError("Edição manual desativada no CRM sincronizado por tarefas.")} style={{ background: C.faint, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 5, padding: "5px 8px", cursor: "pointer" }}>{Ico.edit}</button>
                            <button onClick={() => setSyncError("Remoção manual desativada no CRM sincronizado por tarefas.")} style={{ background: "#1A0F0F", border: "1px solid #2A1515", color: C.red, borderRadius: 5, padding: "5px 8px", cursor: "pointer" }}>{Ico.trash}</button>
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
            onClose={() => setSelected(null)}
            onEdit={() => setSyncError("Edição manual desativada no CRM sincronizado por tarefas.")}
            onDelete={() => setSyncError("Remoção manual desativada no CRM sincronizado por tarefas.")}
          />
        )}
      </div>
    </div>
  );
}
