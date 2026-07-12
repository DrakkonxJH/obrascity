"use client";

import { CrmCard as CrmCardType } from "@/lib/domains/crm/entities";

type CrmCardProps = {
  card: CrmCardType;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: (id: string) => void;
};

export function CrmCard({ card, onDragStart, onClick }: CrmCardProps) {
  const initials = card.responsible ? card.responsible.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "S/R";

  let priorityBorder = "border-l-slate-600";
  let priorityBadge = "bg-slate-900 text-muted border border-steel";

  if (card.priority === "Alta") {
    priorityBorder = "border-l-rose-500";
    priorityBadge = "bg-rose-950/40 text-rose-400 border border-rose-900/30";
  } else if (card.priority === "Média") {
    priorityBorder = "border-l-amber-500";
    priorityBadge = "bg-amber-950/40 text-amber-400 border border-amber-900/30";
  }

  const subtasks = card.subtasks || [];
  const done = subtasks.filter(s => s.done).length;
  const percent = subtasks.length > 0 ? Math.round((done / subtasks.length) * 100) : 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, card.id)}
      onClick={() => onClick(card.id)}
      className={`bg-dark2 p-4 rounded-xl border border-steel hover:border-fire/60 hover:shadow-[0_4px_16px_rgba(255,107,26,0.15)] hover:-translate-y-[1px] transition-all duration-150 cursor-grab active:cursor-grabbing relative group border-l-4 ${priorityBorder}`}
    >
      <h4 className="font-bold text-white text-sm leading-tight pr-6 break-words">{card.title}</h4>
      <p className="text-xs text-muted line-clamp-2 leading-relaxed mt-1">{card.desc}</p>

      {subtasks.length > 0 && (
        <div className="space-y-1 pt-1.5">
          <div className="flex justify-between text-[10px] text-muted">
            <span>Checklist ({percent}%)</span>
          </div>
          <div className="w-full bg-steel h-1 rounded-full overflow-hidden">
            <div className="bg-fire h-full" style={{ width: `${percent}%` }}></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-steel text-xs">
        <span className="font-bold text-emerald-400">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.cost)}
        </span>
        <div className="flex items-center space-x-1.5">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${priorityBadge}">
            {card.priority}
          </span>
          <div className="w-5 h-5 rounded-full bg-steel border border-steel text-[9px] font-bold text-light flex items-center justify-center">
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
}
