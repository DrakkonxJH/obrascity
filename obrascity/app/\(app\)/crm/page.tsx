"use client";

import React, { useState, useEffect } from "react";
import { getCrmService } from "@/lib/domains/crm/service";
import { CrmCard as CrmCardComponent } from "@/components/organisms/crm-card";
import { CRMCardModal } from "@/components/organisms/crm-card-modal";
import { PageHeader } from "@/components/molecules/page-header";
import { Search } from "lucide-react";
import { useAppUi } from "@/components/templates/app-ui-provider";

export default function CrmPage() {
  const [sectors, setSectors] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [cards, setCards] = useState([]);
  const [activeSectorId, setActiveSectorId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const { openDetail } = useAppUi();

  useEffect(() => {
    async function loadData() {
      try {
        const service = await getCrmService();
        const { sectors, pipeline, cards } = await service.getBoardData();
        setSectors(sectors);
        setPipeline(pipeline);
        setCards(cards);
        if (sectors.length > 0) setActiveSectorId(sectors[0].id);
      } catch (e) {
        console.error("Failed to load CRM data", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDragStart = (id: string) => {
    setDraggedCardId(id);
  };

  const handleDrop = async (targetStepIndex: number) => {
    if (!draggedCardId) return;

    try {
      const service = await getCrmService();
      await service.promoteCard(draggedCardId);

      // Refresh data
      const { cards: updatedCards } = await service.getBoardData();
      setCards(updatedCards);
    } catch (e: any) {
      alert(e.message || "Erro ao promover card");
    } finally {
      setDraggedCardId(null);
    }
  };

  const handleCardClick = (cardId: string) => {
    const card = cards.find((c: any) => c.id === cardId);
    if (!card) return;

    openDetail({
      title: card.title,
      rows: [
        { label: "Responsável", value: card.responsible },
        { label: "Prioridade", value: card.priority },
        { label: "Valor", value: `R$ ${card.cost.toLocaleString('pt-BR')}` },
      ],
    });
  };

  const openCreateModal = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cardId: string) => {
    const card = cards.find((c: any) => c.id === cardId);
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleSaveCard = async (formData: any) => {
    try {
      const service = await getCrmService();
      if (editingCard?.id) {
        await service.repository.updateCard(editingCard.id, formData);
      } else {
        await service.repository.createCard(formData);
      }

      const { cards: updatedCards } = await service.getBoardData();
      setCards(updatedCards);
      setIsModalOpen(false);
    } catch (e: any) {
      alert("Erro ao salvar card: " + e.message);
    }
  };

  if (isLoading) return <div className="p-8 text-white">Carregando CRM...</div>;

  const activeSector = sectors.find((s: any) => s.id === activeSectorId);
  const activeSectorSteps = pipeline.filter((step: any) => step.sectorId === activeSectorId);

  return (
    <section className="of-page">
      <PageHeader
        eyebrow="Comercial"
        title="CRM de Vendas"
        subtitle="Gestão de leads e pipeline de vendas sequencial."
        actions={
          <button onClick={openCreateModal} className="of-btn-ghost">Novo Lead</button>
        }
      />

      <div className="flex gap-6 mb-8 overflow-x-auto pb-2">
        {sectors.map((sec: any) => (
          <button
            key={sec.id}
            onClick={() => setActiveSectorId(sec.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeSectorId === sec.id
                ? "bg-fire text-white shadow-lg shadow-fire/20"
                : "bg-dark2 text-muted hover:text-white border border-steel"
            }`}
          >
            {sec.name}
          </button>
        ))}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 items-start min-h-[600px]">
        {activeSectorSteps.map((step: any, idx: number) => {
          const filteredCards = cards.filter((card: any) => {
            const stepGlobalIndex = pipeline.findIndex((s: any) => s.step === step.step);
            const matchesStep = card.currentStepIndex === stepGlobalIndex;
            const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStep && matchesSearch;
          });

          return (
            <div
              key={step.step}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(pipeline.findIndex((s: any) => s.step === step.step))}
              className="w-80 flex-shrink-0 flex flex-col max-h-[calc(100vh-300px)] rounded-xl border border-steel bg-dark/50 backdrop-blur-sm"
            >
              <div className="p-4 flex items-center justify-between border-b border-steel bg-dark2/40 rounded-t-xl">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-fire font-mono bg-fire/5 border border-fire/15 px-1.5 py-0.5 rounded">Fase {step.step}</span>
                  <span className="font-bold text-white text-sm tracking-wide uppercase">{step.stageName}</span>
                  <span className="text-[10px] font-mono font-bold text-light bg-steel px-2 py-0.5 rounded-full">{filteredCards.length}</span>
                </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {filteredCards.map((card: any) => (
                  <div key={card.id} className="group relative">
                    <CrmCardComponent
                      card={card}
                      onDragStart={handleDragStart}
                      onClick={handleCardClick}
                    />
                    <button
                      onClick={() => openEditModal(card.id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition p-1 text-muted hover:text-fire bg-dark rounded border border-transparent hover:border-steel"
                      title="Editar"
                    >
                      <i className="fa-solid fa-edit text-xs"></i>
                    </button>
                  </div>
                ))}
                {filteredCards.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted border border-dashed border-steel rounded-lg bg-dark2/10">
                    Nenhum card nesta fase.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <CRMCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        card={editingCard}
        onSave={handleSaveCard}
      />
    </section>
  );
}
