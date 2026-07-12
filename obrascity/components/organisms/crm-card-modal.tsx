"use client";

import React, { useState, useEffect } from "react";
import { CrmCard as CrmCardType, CreateProjetoDocumentoInput } from "@/lib/domains/crm/entities";
import { getCrmService } from "@/lib/domains/crm/service";

type CRMCardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  card?: CrmCardType | null;
  onSave: (card: Partial<CrmCardType>) => Promise<void>;
};

export function CRMCardModal({ isOpen, onClose, card, onSave }: CRMCardModalProps) {
  const [formData, setFormData] = useState<Partial<CrmCardType>>({});

  useEffect(() => {
    if (card) {
      setFormData(card);
    } else {
      setFormData({
        title: "",
        desc: "",
        responsible: "",
        priority: "Média",
        startDate: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0],
        cost: 0,
      });
    }
  }, [card]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-dark border border-steel rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-steel flex items-center justify-between bg-dark2/40">
          <h3 className="text-lg font-bold text-white font-condensed uppercase tracking-wide">
            {card ? "Editar Atividade de CRM" : "Nova Atividade de CRM"}
          </h3>
          <button onClick={onClose} className="text-muted hover:text-white transition">
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Título do Projeto / Lead</label>
            <input
              type="text"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-dark border border-steel text-white text-sm focus:ring-1 focus:ring-fire outline-none transition"
              placeholder="Ex: Edifício Aurora - Unidade 101"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Responsável</label>
              <input
                type="text"
                value={formData.responsible || ""}
                onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dark border border-steel text-white text-sm focus:ring-1 focus:ring-fire outline-none transition"
                placeholder="Nome do responsável"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Prioridade</label>
              <select
                value={formData.priority || "Média"}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-dark border border-steel text-white text-sm focus:ring-1 focus:ring-fire outline-none transition"
              >
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Descrição / Observações</label>
            <textarea
              value={formData.desc || ""}
              onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-dark border border-steel text-white text-sm focus:ring-1 focus:ring-fire outline-none transition h-24 resize-none"
              placeholder="Detalhes do lead ou status do processo..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Data Início</label>
              <input
                type="date"
                value={formData.startDate || ""}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dark border border-steel text-white text-sm focus:ring-1 focus:ring-fire outline-none transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Prazo Final</label>
              <input
                type="date"
                value={formData.date || ""}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-dark border border-steel text-white text-sm focus:ring-1 focus:ring-fire outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Valor Estimado (BRL)</label>
            <input
              type="number"
              value={formData.cost || ""}
              onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-dark border border-steel text-white text-sm focus:ring-1 focus:ring-fire outline-none transition"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg bg-dark2 text-muted hover:text-white border border-steel text-xs font-bold uppercase transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-lg bg-fire hover:bg-fire-hover text-white text-xs font-bold uppercase transition shadow-lg shadow-fire/20"
            >
              Salvar Atividade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
