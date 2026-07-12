'use client';

// components/organisms/CRMBoard.tsx
// PRODUCTION READY REACT + TYPESCRIPT FRONTEND IMPLEMENTATION FOR NEXT.JS
// Integrates seamless sequential POP, Custom Kanban columns, and MS Project-style dependency lines in pure SVG!

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Card, WorkflowStep, Sector, Subtask, Comment, AuditLog, Attachment } from '../app/actions/crmActions';

interface CRMBoardProps {
  initialCards?: Card[];
  initialWorkflow?: WorkflowStep[];
  initialSectors?: Sector[];
  onSaveCard?: (card: Card) => Promise<any>;
  onSaveWorkflow?: (workflow: WorkflowStep[], updatedCards: Card[]) => Promise<any>;
  onDeleteCard?: (cardId: string) => Promise<any>;
}

export default function CRMBoard({
  initialCards = [],
  initialWorkflow = [],
  initialSectors = [],
  onSaveCardsServer,
  onSaveWorkflowServer
}: {
  initialCards?: Card[];
  initialWorkflow?: any[];
  onSaveCards?: any;
} & any) {

    // ----------------------------------------------------
    // LOCAL STATES & PERSISTENCE
    // ----------------------------------------------------
    const [sectors, setSectors] = useState<Sector[]>(initialSectors.length > 0 ? initialSectors : [
        { id: "vendas", name: "Vendas / Comercial", icon: "fa-users", color: "purple", budgetLimit: 500000.00 },
        { id: "financeiro", name: "Financeiro", icon: "fa-file-invoice-dollar", color: "emerald", budgetLimit: 200000.00 },
        { id: "engenharia", name: "Engenharia", icon: "fa-hard-hat", color: "fire", budgetLimit: 90000.00 }
    ]);

    const [workflow, setWorkflow] = useState<WorkflowStep[]>(initialWorkflow.length > 0 ? initialWorkflow : [
        {
            step: 1,
            sectorId: "vendas",
            stageName: "Captação & Leads",
            color: "purple",
            icon: "fa-users",
            subtasks: [
                "Ligar para o Lead e qualificar interesse",
                "Registrar dados de contato e do empreendimento",
                "Verificar viabilidade de financiamento inicial",
                "Agendar visita técnica ou comercial"
            ]
        },
        {
            step: 2,
            sectorId: "vendas",
            stageName: "Visita Comercial",
            color: "purple",
            icon: "fa-users",
            subtasks: [
                "Apresentar memorial descritivo da obra",
                "Apresentar simulação de fluxo de pagamentos",
                "Coletar documentos do comprador (RG/CPF)",
                "Assinar proposta e reservar lote/unidade"
            ]
        },
        {
            step: 3,
            sectorId: "financeiro",
            stageName: "Auditoria & Orçamento",
            color: "emerald",
            icon: "fa-file-invoice-dollar",
            subtasks: [
                "Análise de crédito e certidões negativas do comprador",
                "Homologação e validação da proposta comercial",
                "Registrar entrada de sinal no fluxo de caixa",
                "Aprovar viabilidade físico-financeira final"
            ]
        },
        {
            step: 4,
            sectorId: "engenharia",
            stageName: "Layout & Projetos",
            color: "fire",
            icon: "fa-hard-hat",
            subtasks: [
                "Realizar verificação topográfica inicial",
                "Efetuar demarcação de divisas (gabarito)",
                "Compatibilizar projetos (Arquitetura x Estrutural)",
                "Aprovar layout final com o cliente"
            ]
        },
        {
            step: 5,
            sectorId: "engenharia",
            stageName: "Execução de Sapatas",
            color: "fire",
            icon: "fa-hard-hat",
            subtasks: [
                "Escavação mecânica de valas das sapatas",
                "Montagem das armaduras de aço e espaçadores",
                "Concretagem usinada de fundação estrutural",
                "Iniciar cura úmida por aspersão (mínimo 7 dias)"
            ]
        }
    ]);

    const [allCards, setAllCards] = useState<Card[]>(initialCards.length > 0 ? initialCards : [
        {
            id: "card-1",
            title: "Obra Residencial Jardins - Unidade 302",
            desc: "Projeto padrão de incorporação cruzando todas as etapas sequenciais de processos e procedimentos da construtora.",
            responsible: "Juliana Torres",
            priority: "Média",
            startDate: "2026-06-25",
            date: "2026-06-30",
            cost: 450000.00,
            isWorkflowCard: true,
            currentStepIndex: 0,
            fvsSigned: false,
            subtasks: [
                { id: "sub-1-1", title: "Ligar para o Lead e qualificar interesse", done: true },
                { id: "sub-1-2", title: "Registrar dados de contato e do empreendimento", done: true },
                { id: "sub-1-3", title: "Verificar viabilidade de financiamento inicial", done: false },
                { id: "sub-1-4", title: "Agendar visita técnica ou comercial", done: false }
            ],
            comments: [
                { author: "Juliana Torres", text: "Proposta iniciada. Lead aquecido.", date: "25/06/2026 10:00" }
            ],
            logs: [{ text: "Projeto iniciado no Fluxo Programado (POP) da Construtora", date: "25/06/2026 09:00" }],
            attachments: []
        },
        {
            id: "card-2",
            title: "Edifício Zona Sul - Fundação Bloco B",
            desc: "Lote estrutural de fundações em fase avançada.",
            responsible: "Ricardo Santos",
            priority: "Alta",
            startDate: "2026-06-25",
            date: "2026-07-12",
            cost: 85000.00,
            isWorkflowCard: true,
            currentStepIndex: 4,
            fvsSigned: false,
            subtasks: [
                { id: "sub-5-1", title: "Escavação mecânica de valas das sapatas", done: true },
                { id: "sub-5-2", title: "Montagem das armaduras de aço e espaçadores", done: true },
                { id: "sub-5-3", title: "Concretagem usinada de fundação estrutural", done: false },
                { id: "sub-5-4", title: "Iniciar cura úmida por aspersão (mínimo 7 dias)", done: false }
            ],
            comments: [],
            logs: [{ text: "Projeto promovido para Fase 5: Execução de Sapatas", date: "25/06/2026 08:30" }],
            attachments: []
        }
    ]);

    const [activeSectorId, setActiveSectorId] = useState<string>("vendas");
    const [viewMode, setViewName] = useState<'kanban' | 'gantt'>('kanban');
    const [selectedGanttCardId, setSelectedGanttCardId] = useState<string>("card-1");
    
    // Filters
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");

    // Drags
    const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

    // Modals
    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [isPOPModalOpen, setIsPOPModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);

    // Editing State bindings
    const [editingCard, setEditingCard] = useState<Partial<Card> | null>(null);
    const [selectedDetailCard, setSelectedDetailCard] = useState<Card | null>(null);
    const [editingSector, setEditingSector] = useState<Partial<Sector> | null>(null);
    const [popTab, setPopTab] = useState<'workflow' | 'procedures'>('workflow');
    
    // Subtasks / comments local bindings inside details
    const [newSubtaskTitle, setNewSubtaskInput] = useState("");
    const [newCommentText, setNewCommentText] = useState("");

    // SVG dependency line rendering hook refs
    const rowsContainerRef = useRef<HTMLDivElement>(null);
    const svgOverlayRef = useRef<SVGSVGElement>(null);

    // Load LocalStorage cache if present
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const cachedCards = localStorage.getItem("obrascity_all_cards");
            const cachedWorkflow = localStorage.getItem("obrascity_programmed_workflow");
            if (cachedCards) setAllCards(JSON.parse(cachedCards));
            if (cachedWorkflow) setWorkflow(JSON.parse(cachedWorkflow));
        }
    }, []);

    // Sync localStorage
    const persistData = (newCards: Card[], newWorkflow?: WorkflowStep[]) => {
        setAllCards(newCards);
        if (newWorkflow) setWorkflow(newWorkflow);
        if (typeof window !== 'undefined') {
            localStorage.setItem("obrascity_all_cards", JSON.stringify(newCards));
            if (newWorkflow) localStorage.setItem("obrascity_programmed_workflow", JSON.stringify(newWorkflow));
        }
    };

    // ----------------------------------------------------
    // MS PROJECT-STYLE SVG DEPEDENCY LINE ENGINE
    // ----------------------------------------------------
    useLayoutEffect(() => {
        if (viewMode !== 'gantt' || !rowsContainerRef.current) return;

        const drawLines = () => {
            const rowsContainer = rowsContainerRef.current;
            const svg = svgOverlayRef.current;
            if (!rowsContainer || !svg) return;

            svg.innerHTML = `
                <defs>
                    <marker id="gantt-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#FF6B1A"/>
                    </marker>
                </defs>
            `;

            const containerRect = rowsContainer.getBoundingClientRect();

            for (let idx = 0; idx < workflow.length - 1; idx++) {
                const step = workflow[idx];
                const nextStep = workflow[idx + 1];

                const barCur = document.getElementById(`gantt-bar-step-${step.step}`);
                const barNext = document.getElementById(`gantt-bar-step-${nextStep.step}`);

                if (barCur && barNext) {
                    const rectCur = barCur.getBoundingClientRect();
                    const rectNext = barNext.getBoundingClientRect();

                    const x1 = rectCur.right - containerRect.left;
                    const y1 = (rectCur.top + rectCur.bottom) / 2 - containerRect.top;

                    const x2 = rectNext.left - containerRect.left;
                    const y2 = (rectNext.top + rectNext.bottom) / 2 - containerRect.top;

                    const shoulderX = x1 + 10;

                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", `M ${x1} ${y1} H ${shoulderX} V ${y2} H ${x2}`);
                    path.setAttribute("stroke", "#FF6B1A");
                    path.setAttribute("stroke-width", "1.5");
                    path.setAttribute("fill", "none");
                    path.setAttribute("marker-end", "url(#gantt-arrow)");
                    path.setAttribute("stroke-dasharray", "4,2");
                    path.setAttribute("class", "opacity-50 hover:opacity-100 hover:stroke-width-2 transition-all duration-300");

                    svg.appendChild(path);
                }
            }
        };

        const timeout = setTimeout(drawLines, 100);
        window.addEventListener('resize', drawLines);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', drawLines);
        };
    }, [viewMode, selectedGanttCardId, workflow, allCards]);

interface WorkflowDateRange {
    step: number;
    startDateStr: string;
    endDateStr: string;
    startDate: Date;
    endDate: Date;
    duration: number;
}

    // ----------------------------------------------------
    // METRICS CALCULATORS
    // ----------------------------------------------------
    const activeSector = sectors.find(s => s.id === activeSectorId) || sectors[0];
    const activeSectorSteps = workflow.filter(step => step.sectorId === activeSectorId);
    
    const activeSectorCards = allCards.filter(card => {
        const step = workflow[card.currentStepIndex];
        return step && step.sectorId === activeSectorId;
    });

    const totalCost = activeSectorCards.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const completedCount = activeSectorCards.filter(card => {
        const subtasks = card.subtasks || [];
        return subtasks.length > 0 && subtasks.every(s => s.done);
    }).length;
    const completionRate = activeSectorCards.length > 0 ? Math.round((completedCount / activeSectorCards.length) * 100) : 0;
    const urgentCount = activeSectorCards.filter(c => c.priority === "Alta").length;

    const switchActiveSector = (sectorId: string) => {
        setActiveSectorId(sectorId);
    };

    const openNewCardModal = (stepIndex?: number) => {
        setEditingCard(stepIndex !== undefined ? { currentStepIndex: stepIndex } : {});
        setIsCardModalOpen(true);
    };

    const openViewCardModal = (cardId: string) => {
        const card = allCards.find((item) => item.id === cardId) || null;
        setSelectedDetailCard(card);
        setIsDetailModalOpen(Boolean(card));
    };

    const selectGanttActiveProject = (cardId: string) => {
        setSelectedGanttCardId(cardId);
    };

    const getSequentialDatesForWorkflow = (card: Card): WorkflowDateRange[] => {
        const dates: WorkflowDateRange[] = [];
        let currentStart = new Date(card.startDate || new Date().toISOString());

        workflow.forEach((step) => {
            let durationDays = 4;
            if (step.step === 1) durationDays = 3;
            if (step.step === 3) durationDays = 5;
            if (step.step === 5) durationDays = 5;

            const start = new Date(currentStart);
            const end = new Date(start);
            end.setDate(start.getDate() + durationDays - 1);

            dates.push({
                step: step.step,
                startDateStr: start.toISOString().split('T')[0],
                endDateStr: end.toISOString().split('T')[0],
                startDate: start,
                endDate: end,
                duration: durationDays
            });

            currentStart = new Date(end);
            currentStart.setDate(end.getDate() + 1);
        });

        return dates;
    };

    const gStart = allCards.length > 0
        ? new Date(Math.min(...allCards.map((card) => new Date(card.startDate || "2026-06-25").getTime())))
        : new Date("2026-06-25T00:00:00");

    // ----------------------------------------------------
    // HANDLERS & ACTIONS
    // ----------------------------------------------------
    const handleDragStart = (e: React.DragEvent, cardId: string) => {
        setDraggedCardId(cardId);
    };

    const handleDrop = (e: React.DragEvent, targetStepIndex: number) => {
        e.preventDefault();
        if (!draggedCardId) return;

        const card = allCards.find(c => c.id === draggedCardId);
        if (!card || card.currentStepIndex === targetStepIndex) return;

        const currentStep = workflow[card.currentStepIndex];
        const targetStep = workflow[targetStepIndex];

        // Evaluate checklists
        const done = card.subtasks.filter(s => s.done).length;
        const isCompleted = card.subtasks.length > 0 && done === card.subtasks.length;

        if (targetStepIndex > card.currentStepIndex && !isCompleted) {
            alert(`⚠️ Bloqueio de Qualidade (FVS): Você precisa concluir todos os procedimentos obrigatórios de "${currentStep.stageName}" antes de avançar para "${targetStep.stageName}"!`);
            return;
        }

        const updatedCards = allCards.map(c => {
            if (c.id === draggedCardId) {
                const nextStep = workflow[targetStepIndex];
                return {
                    ...c,
                    currentStepIndex: targetStepIndex,
                    subtasks: nextStep ? nextStep.subtasks.map((t, i) => ({ id: `sub-${Date.now()}-${i}`, title: t, done: false })) : [],
                    logs: [
                        { text: `Movido de "${currentStep.stageName}" para "${targetStep.stageName}"`, date: getCurrentTimestamp() },
                        ...c.logs
                    ]
                };
            }
            return c;
        });

        persistData(updatedCards);
        setDraggedCardId(null);
    };

    const handleSaveNewCard = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCard || !editingCard.title) return;

        const targetStepIndex = editingCard.currentStepIndex ?? 0;
        const step = workflow[targetStepIndex];

        let updatedCards: Card[];

        if (editingCard.id) {
            // Update
            updatedCards = allCards.map(c => {
                if (c.id === editingCard.id) {
                    const changedStep = c.currentStepIndex !== targetStepIndex;
                    return {
                        ...c,
                        ...(editingCard as Card),
                        subtasks: changedStep && step ? step.subtasks.map((t, i) => ({ id: `sub-${Date.now()}-${i}`, title: t, done: false })) : c.subtasks
                    };
                }
                return c;
            });
        } else {
            // Create
            const newCard: Card = {
                id: `card-${Date.now()}`,
                title: editingCard.title,
                desc: editingCard.desc || `Procedimento padrão da fase ${step?.stageName}`,
                responsible: editingCard.responsible || 'Sem Alocação',
                priority: editingCard.priority || 'Média',
                startDate: editingCard.startDate || new Date().toISOString().split('T')[0],
                date: editingCard.date || new Date().toISOString().split('T')[0],
                cost: editingCard.cost || 0,
                fvsSigned: false,
                isWorkflowCard: true,
                currentStepIndex: targetStepIndex,
                subtasks: step ? step.subtasks.map((t, i) => ({ id: `sub-${Date.now()}-${i}`, title: t, done: false })) : [],
                comments: [],
                logs: [{ text: `Card iniciado na Fase ${step?.step}: ${step?.stageName}`, date: getCurrentTimestamp() }],
                attachments: []
            };
            updatedCards = [...allCards, newCard];
            setActiveSectorId(step.sectorId);
        }

        persistData(updatedCards);
        setIsCardModalOpen(false);
        setEditingCard(null);
    };

    const promoteCard = () => {
        if (!selectedDetailCard) return;

        const nextStepIndex = selectedDetailCard.currentStepIndex + 1;
        if (nextStepIndex >= workflow.length) return;

        const nextStep = workflow[nextStepIndex];

        const updatedCards = allCards.map(c => {
            if (c.id === selectedDetailCard.id) {
                const generatedSubtasks = nextStep ? nextStep.subtasks.map((t, idx) => ({ id: `sub-${Date.now()}-${idx}`, title: t, done: false })) : [];
                return {
                    ...c,
                    currentStepIndex: nextStepIndex,
                    subtasks: generatedSubtasks,
                    logs: [
                        { text: `🚀 Card promovido para a Etapa ${nextStepIndex + 1}: "${nextStep.stageName}" [Setor: ${nextStep.sectorId.toUpperCase()}]`, date: getCurrentTimestamp() },
                        ...c.logs
                    ]
                };
            }
            return c;
        });

        persistData(updatedCards);
        setIsDetailModalOpen(false);
        setSelectedDetailCard(null);
        setActiveSectorId(nextStep.sectorId);
        alert(`Sucesso! O projeto foi transferido para o setor "${nextStep.sectorId.toUpperCase()}" na etapa "${nextStep.stageName}".`);
    };

    const signFVS = () => {
        if (!selectedDetailCard) return;

        const updatedCards = allCards.map(c => {
            if (c.id === selectedDetailCard.id) {
                return {
                    ...c,
                    fvsSigned: true,
                    fvsSignedBy: "Ricardo Santos (Diretor)",
                    fvsSignedDate: getCurrentTimestamp(),
                    fvsHash: 'sha256-' + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10),
                    logs: [
                        { text: "✓ Ficha de Verificação (FVS) HOMOLOGADA e Assinada Digitalmente", date: getCurrentTimestamp() },
                        ...c.logs
                    ]
                };
            }
            return c;
        });

        persistData(updatedCards);
        // Refresh detail modal
        const target = updatedCards.find(c => c.id === selectedDetailCard.id);
        if (target) setSelectedDetailCard(target);
    };

    const unsignFVS = () => {
        if (!selectedDetailCard || !confirm("Deseja realmente desfazer a assinatura digital de qualidade desta FVS?")) return;

        const updatedCards = allCards.map(c => {
            if (c.id === selectedDetailCard.id) {
                return {
                    ...c,
                    fvsSigned: false,
                    fvsSignedBy: null,
                    fvsSignedDate: null,
                    fvsHash: null,
                    logs: [
                        { text: "Assinatura digital de qualidade desfeita por Ricardo Santos", date: getCurrentTimestamp() },
                        ...c.logs
                    ]
                };
            }
            return c;
        });

        persistData(updatedCards);
        const target = updatedCards.find(c => c.id === selectedDetailCard.id);
        if (target) setSelectedDetailCard(target);
    };

    const handleAddSubtask = () => {
        if (!selectedDetailCard || !newSubtaskTitle.trim()) return;

        const updatedCards = allCards.map(c => {
            if (c.id === selectedDetailCard.id) {
                const sub = { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), done: false };
                return {
                    ...c,
                    subtasks: [...c.subtasks, sub],
                    logs: [{ text: `Adicionou subtarefa: "${newSubtaskTitle.trim()}"`, date: getCurrentTimestamp() }, ...c.logs]
                };
            }
            return c;
        });

        persistData(updatedCards);
        setNewSubtaskInput("");
        const target = updatedCards.find(c => c.id === selectedDetailCard.id);
        if (target) setSelectedDetailCard(target);
    };

    const handleToggleSubtask = (subId: string) => {
        if (!selectedDetailCard || selectedDetailCard.fvsSigned) return;

        const updatedCards = allCards.map(c => {
            if (c.id === selectedDetailCard.id) {
                const updatedSubs = c.subtasks.map(s => {
                    if (s.id === subId) {
                        return { ...s, done: !s.done };
                    }
                    return s;
                });
                const targetSub = c.subtasks.find(s => s.id === subId);
                return {
                    ...c,
                    subtasks: updatedSubs,
                    logs: [{ text: `Marcou subtarefa "${targetSub?.title}" como ${!targetSub?.done ? 'Concluída' : 'Pendente'}`, date: getCurrentTimestamp() }, ...c.logs]
                };
            }
            return c;
        });

        persistData(updatedCards);
        const target = updatedCards.find(c => c.id === selectedDetailCard.id);
        if (target) setSelectedDetailCard(target);
    };

    const handleAddComment = () => {
        if (!selectedDetailCard || !newCommentText.trim()) return;

        const updatedCards = allCards.map(c => {
            if (c.id === selectedDetailCard.id) {
                const com = { author: "Ricardo Santos", text: newCommentText.trim(), date: getCurrentTimestamp() };
                return {
                    ...c,
                    comments: [...c.comments, com],
                    logs: [{ text: "Adicionou anotação no diário do projeto", date: getCurrentTimestamp() }, ...c.logs]
                };
            }
            return c;
        });

        persistData(updatedCards);
        setNewCommentText("");
        const target = updatedCards.find(c => c.id === selectedDetailCard.id);
        if (target) setSelectedDetailCard(target);
    };

    // ----------------------------------------------------
    // PIPELINE SEQUENCER POP MODAL MANIPULATORS
    // ----------------------------------------------------
    const [newSOPStepTitle, setNewSOPStepTitle] = useState("");

    const movePipelineStep = (idx: number, direction: number) => {
        const targetIdx = idx + direction;
        if (targetIdx < 0 || targetIdx >= workflow.length) return;

        const list = [...workflow];
        const temp = list[idx];
        list[idx] = list[targetIdx];
        list[targetIdx] = temp;

        list.forEach((step, i) => {
            step.step = i + 1;
        });

        // Re-sequence card steps indices to avoid crashes
        const updatedCards = allCards.map(c => {
            if (c.currentStepIndex === idx) return { ...c, currentStepIndex: targetIdx };
            if (c.currentStepIndex === targetIdx) return { ...c, currentStepIndex: idx };
            return c;
        });

        persistData(updatedCards, list);
    };

    const handleAddSOPItem = (stepIndex: number, text: string) => {
        if (!text.trim()) return;
        const list = [...workflow];
        list[stepIndex].subtasks.push(text.trim());

        // Sync card checklists sitting on this step
        const updatedCards = allCards.map(card => {
            if (card.currentStepIndex === stepIndex && !card.fvsSigned) {
                const old = card.subtasks || [];
                return {
                    ...card,
                    subtasks: list[stepIndex].subtasks.map(t => {
                        const exists = old.find(o => o.title === t);
                        return { id: exists?.id || `sub-${Math.random()}`, title: t, done: exists?.done || false };
                    })
                };
            }
            return card;
        });

        persistData(updatedCards, list);
    };

    const handleRemoveSOPItem = (stepIndex: number, subIndex: number) => {
        const list = [...workflow];
        list[stepIndex].subtasks.splice(subIndex, 1);

        const updatedCards = allCards.map(card => {
            if (card.currentStepIndex === stepIndex && !card.fvsSigned) {
                const old = card.subtasks || [];
                return {
                    ...card,
                    subtasks: list[stepIndex].subtasks.map(t => {
                        const exists = old.find(o => o.title === t);
                        return { id: exists?.id || `sub-${Math.random()}`, title: t, done: exists?.done || false };
                    })
                };
            }
            return card;
        });

        persistData(updatedCards, list);
    };

    const handleAddNewPipelineStep = () => {
        if (!newSOPStepTitle.trim()) return;
        const nextStep = workflow.length + 1;
        const newStep: WorkflowStep = {
            step: nextStep,
            sectorId: "vendas",
            stageName: newSOPStepTitle.trim(),
            color: "purple",
            icon: "fa-users",
            subtasks: ["Procedimento padrão 1", "Procedimento padrão 2"]
        };
        const list = [...workflow, newStep];
        persistData(allCards, list);
        setNewSOPStepTitle("");
    };

    const handleRemovePipelineStep = (idx: number) => {
        if (workflow.length <= 1) {
            alert("O fluxo programado corporativo deve conter pelo menos uma fase sequencial ativa.");
            return;
        }
        if (!confirm("Tem certeza que deseja excluir esta fase do processo? Todos os cards nela serão reajustados.")) return;

        const list = workflow.filter((_, i) => i !== idx);
        list.forEach((step, i) => {
            step.step = i + 1;
        });

        const updatedCards = allCards.map(c => {
            if (c.currentStepIndex >= list.length) {
                return { ...c, currentStepIndex: list.length - 1 };
            }
            return c;
        });

        persistData(updatedCards, list);
    };

    // ----------------------------------------------------
    // UTILS
    // ----------------------------------------------------
    const getHexForColor = (color: string) => {
        switch (color) {
            case "fire": return "#FF6B1A";
            case "emerald": return "#10B981";
            case "cyan": return "#06B6D4";
            case "purple": return "#A855F7";
            default: return "#94A3B8";
        }
    };

    const getHexForColorLight = (color: string) => {
        switch (color) {
            case "fire": return "rgba(255, 107, 26, 0.15)";
            case "emerald": return "rgba(16, 185, 129, 0.15)";
            case "cyan": return "rgba(6, 182, 212, 0.15)";
            case "purple": return "rgba(168, 85, 247, 0.15)";
            default: return "rgba(148, 163, 184, 0.15)";
        }
    };

    const getCurrentTimestamp = () => {
        const now = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    };

    // ----------------------------------------------------
    // JSX TEMPLATE RENDERER
    // ----------------------------------------------------
    return (
        <div className="h-screen flex overflow-hidden relative font-sans text-light bg-void">
            
            {/* SIDEBAR */}
            <aside className="w-64 bg-dark text-light flex flex-col justify-between z-30 flex-shrink-0 shadow-2xl border-r border-steel relative">
                <div>
                    <div className="p-6 border-b border-steel flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fire to-[#CC5200] flex items-center justify-center text-white font-black text-base shadow-[0_4px_16px_rgba(255,107,26,0.4)]">
                                OC
                            </div>
                            <div>
                                <span className="font-extrabold text-lg text-white font-condensed tracking-wide">ObrasCit<span className="text-fire">Y</span></span>
                                <span className="block text-[9px] text-muted font-medium uppercase tracking-wider">Gestão Inteligente</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-muted uppercase tracking-wider mb-3 px-2">
                            <span>Setores / Áreas</span>
                            <button onClick={() => { setEditingSector({}); setIsSectorModalOpen(true); }} className="text-fire hover:text-fire-hover transition">
                                <i className="fa-solid fa-plus-circle text-base"></i>
                            </button>
                        </div>
                        
                        <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-380px)] mb-4">
                            {sectors.map(sec => {
                                const isActive = sec.id === activeSectorId;
                                const countOfCards = allCards.filter(card => {
                                    const step = workflow[card.currentStepIndex];
                                    return step && step.sectorId === sec.id;
                                }).length;

                                return (
                                    <button key={sec.id} onClick={() => switchActiveSector(sec.id)} className={`w-full text-left py-2.5 px-3 rounded-md transition duration-150 flex items-center justify-between group sector-badge ${isActive ? 'bg-fire/10 text-fire border-l-4 border-fire font-bold' : 'text-muted hover:bg-steel/40 hover:text-white'}`}>
                                        <div className="flex items-center space-x-2.5 min-w-0">
                                            <i className={`fa-solid ${sec.icon} text-sm flex-shrink-0`}></i>
                                            <span className="truncate text-sm font-semibold tracking-wide">{sec.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`w-1.5 h-1.5 rounded-full bg-fire ${isActive ? 'animate-pulse' : 'opacity-40'}`}></span>
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-void text-light/75">{countOfCards}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="pt-2 border-t border-steel/60">
                            <button onClick={() => setIsPOPModalOpen(true)} className="w-full py-2.5 px-3 rounded-lg bg-steel/30 hover:bg-steel/60 border border-steel hover:border-fire/30 text-left text-xs font-bold transition flex items-center justify-between group">
                                <span className="flex items-center space-x-2 text-white">
                                    <i className="fa-solid fa-route text-fire animate-pulse"></i>
                                    <span>Modelador de Processos (POP)</span>
                                </span>
                                <span className="text-[9px] bg-fire/10 text-fire px-1 py-0.5 rounded font-mono font-bold">POP</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-steel bg-void/50">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-steel flex items-center justify-center font-bold text-white border border-[#FF6B1A]/40 shadow-[0_0_10px_rgba(255,107,26,0.2)]">RS</div>
                        <div>
                            <p className="text-sm font-semibold text-white">Ricardo Santos</p>
                            <p className="text-xs text-muted">Diretor de Obras</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN WORKSPACE */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-void relative z-10">
                <header className="h-16 bg-dark/95 border-b border-steel flex items-center justify-between px-8 z-10 shadow-lg backdrop-blur-md flex-shrink-0">
                    <div className="flex items-center space-x-4">
                        <div className="p-2.5 rounded-lg bg-steel text-fire flex items-center justify-center border border-steel shadow-[0_0_12px_rgba(255,107,26,0.1)]">
                            <i className="fa-solid fa-hard-hat text-lg"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold font-condensed tracking-wide text-white uppercase leading-tight">{activeSector?.name}</h1>
                            <p className="text-xs text-muted">Acompanhamento e Organização de Demandas de Canteiro</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* VIEW TOGGLE */}
                        <div className="bg-dark border border-steel p-0.5 rounded-full flex items-center relative h-9">
                            <button onClick={() => setViewName('kanban')} className={`relative z-10 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center space-x-1.5 h-7 ${viewMode === 'kanban' ? 'bg-gradient-to-r from-fire to-fire-hover text-white shadow-[0_2px_8px_rgba(255,107,26,0.3)]' : 'text-muted'}`}>
                                <i className="fa-solid fa-table-columns text-[10px]"></i>
                                <span>Kanban</span>
                            </button>
                            <button onClick={() => setViewName('gantt')} className={`relative z-10 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center space-x-1.5 h-7 ${viewMode === 'gantt' ? 'bg-gradient-to-r from-fire to-fire-hover text-white shadow-[0_2px_8px_rgba(255,107,26,0.3)]' : 'text-muted'}`}>
                                <i className="fa-solid fa-chart-gantt text-[10px]"></i>
                                <span>Gantt / Prazo</span>
                            </button>
                        </div>

                        {/* Search & filters */}
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar card..." className="w-36 md:w-44 pl-4 pr-4 py-1.5 border border-steel rounded-full text-xs bg-dark2 focus:outline-none h-9 text-white" />
                        
                        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-2 py-1.5 border border-steel rounded-lg text-xs bg-dark2 text-light focus:outline-none h-9">
                            <option value="all">Todas</option>
                            <option value="Alta">Alta</option>
                            <option value="Média">Média</option>
                            <option value="Baixa">Baixa</option>
                        </select>

                        <button onClick={() => openNewCardModal()} className="bg-fire hover:bg-fire-hover text-white font-bold text-xs py-1.5 px-4 rounded-lg flex items-center space-x-1.5 shadow-[0_4px_12px_rgba(255,107,26,0.3)] h-9">
                            <i className="fa-solid fa-plus text-[10px]"></i>
                            <span>Novo Card</span>
                        </button>
                    </div>
                </header>

                {/* KPI SUMMARY BAR */}
                <section className="bg-dark border-b border-steel px-8 py-3 grid grid-cols-4 gap-4 flex-shrink-0">
                    <div className="flex items-center space-x-3 bg-dark2/50 p-2.5 rounded-lg border border-steel">
                        <div className="p-2.5 rounded bg-steel text-fire"><i className="fa-solid fa-list-check"></i></div>
                        <div>
                            <span className="block text-[9px] uppercase font-bold text-muted tracking-wider">Atividades Totais</span>
                            <span className="text-base font-bold font-condensed tracking-wide text-white">{activeSectorCards.length}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-dark2/50 p-2.5 rounded-lg border border-steel relative">
                        <div className="p-2.5 rounded bg-steel text-emerald-400"><i className="fa-solid fa-hand-holding-dollar"></i></div>
                        <div>
                            <span className="block text-[9px] uppercase font-bold text-muted tracking-wider">Verba Estimada</span>
                            <span className="text-base font-bold font-condensed tracking-wide text-white">R$ {totalCost.toLocaleString('pt-BR')}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-dark2/50 p-2.5 rounded-lg border border-steel">
                        <div className="p-2.5 rounded bg-steel text-cyan-400"><i className="fa-solid fa-chart-line"></i></div>
                        <div>
                            <span className="block text-[9px] uppercase font-bold text-muted tracking-wider">Taxa de Entrega</span>
                            <span className="text-base font-bold font-condensed tracking-wide text-white">{completionRate}%</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-dark2/50 p-2.5 rounded-lg border border-steel">
                        <div className="p-2.5 rounded bg-steel text-rose-500"><i className="fa-solid fa-circle-exclamation"></i></div>
                        <div>
                            <span className="block text-[9px] uppercase font-bold text-muted tracking-wider">Alta Prioridade</span>
                            <span className="text-base font-bold font-condensed tracking-wide text-rose-500 animate-pulse">{urgentCount}</span>
                        </div>
                    </div>
                </section>

                {/* BOARD CONTENT */}
                {viewMode === 'kanban' ? (
                    <div className="flex-1 overflow-x-auto p-8 flex space-x-6 items-start" id="kanban-board">
                        {activeSectorSteps.map((col, idx) => {
                            const stepGlobalIndex = workflow.findIndex(s => s.step === col.step);
                            const cardList = allCards.filter(card => {
                                const matchesStep = card.currentStepIndex === stepGlobalIndex;
                                const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) || card.desc.toLowerCase().includes(searchQuery.toLowerCase());
                                const matchesPriority = priorityFilter === 'all' || card.priority === priorityFilter;
                                return matchesStep && matchesSearch && matchesPriority;
                            });

                            return (
                                <div key={col.step} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, stepGlobalIndex)} className="w-72 flex-shrink-0 flex flex-col max-h-[calc(100vh-230px)] rounded-xl border border-steel shadow-2xl bg-dark/80">
                                    <div className="p-4 flex items-center justify-between border-b border-steel bg-dark2/45 rounded-t-xl">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs font-bold text-fire font-mono bg-fire/5 border border-fire/15 px-1.5 py-0.5 rounded">Fase {col.step}</span>
                                            <span className="font-bold text-white text-sm tracking-wide font-condensed uppercase">{col.stageName}</span>
                                            <span className="text-[10px] font-mono font-bold text-light bg-steel px-2 py-0.5 rounded-full">{cardList.length}</span>
                                        </div>
                                        <button onClick={() => openNewCardModal(stepGlobalIndex)} className="text-muted hover:text-fire transition">
                                            <i className="fa-solid fa-plus-circle text-base"></i>
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                        {cardList.map(card => {
                                            const subtasks = card.subtasks || [];
                                            const done = subtasks.filter(s => s.done).length;
                                            const percent = subtasks.length > 0 ? Math.round((done / subtasks.length) * 100) : 0;
                                            const initials = card.responsible ? card.responsible.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'S/R';

                                            return (
                                                <div key={card.id} draggable onDragStart={(e) => handleDragStart(e, card.id)} onClick={() => openViewCardModal(card.id)} className="bg-dark2 p-4 rounded-xl border border-steel hover:border-fire/60 hover:shadow-[0_4px_16px_rgba(255,107,26,0.15)] hover:-translate-y-[1px] transition-all duration-150 cursor-grab active:cursor-grabbing relative group border-l-4 border-l-fire">
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
                                                        <span className="font-bold text-emerald-400">R$ {card.cost.toLocaleString('pt-BR')}</span>
                                                        <span className="w-5 h-5 rounded-full bg-steel border border-steel text-[9px] font-bold text-light flex items-center justify-center">{initials}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {cardList.length === 0 && (
                                            <div className="text-center py-8 text-xs text-muted border border-dashed border-steel rounded-lg bg-dark2/10">Arraste ou inicie um card aqui.</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* GANTT VIEW */
                    <div className="flex-1 overflow-y-auto p-8" id="gantt-board-view">
                        <div className="bg-dark border border-steel rounded-xl shadow-2xl overflow-hidden backdrop-blur-md flex flex-col h-full max-h-[calc(100vh-230px)]">
                            <div className="p-4 bg-dark2/60 border-b border-steel flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center space-x-3">
                                    <i className="fa-solid fa-calendar-days text-fire"></i>
                                    <span className="text-sm font-bold font-condensed tracking-wider uppercase text-white">Cronograma Físico de Atividades (Gantt)</span>
                                </div>
                            </div>
                            
                            {/* Project Selectors */}
                            <div className="p-4 bg-dark2/40 border-b border-steel flex items-center space-x-3 flex-wrap">
                                <span className="text-xs text-muted font-bold uppercase tracking-wider">Visualizar Obra:</span>
                                <div className="flex items-center space-x-1.5 p-1 bg-dark rounded-lg border border-steel">
                                    {allCards.map(c => (
                                        <button key={c.id} onClick={() => selectGanttActiveProject(c.id)} className={`px-3.5 py-1 rounded text-xs font-bold transition ${c.id === selectedGanttCardId ? 'bg-fire text-white' : 'text-muted hover:text-white'}`}>
                                            {c.title.split(' - ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Gantt Matrix Grid */}
                            <div className="flex-1 overflow-auto relative" ref={rowsContainerRef}>
                                <div className="min-w-[900px]">
                                    <div className="grid grid-cols-[240px_1fr] bg-dark2/30 border-b border-steel text-center text-[10px] font-bold text-muted uppercase tracking-wider">
                                        <div className="text-left p-3 border-r border-steel">Fase / Atividade</div>
                                        <div className="grid font-mono" style={{ gridTemplateColumns: 'repeat(21, minmax(0, 1fr))' }}>
                                            {Array.from({ length: 21 }).map((_, i) => (
                                                <div key={i} className="p-3 border-r border-steel/30">{i + 25}/06</div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SVG Overlay */}
                                    <svg ref={svgOverlayRef} className="absolute inset-0 pointer-events-none z-20 w-full h-full" style={{ minWidth: '900px' }}></svg>

                                    {/* Render rows */}
                                    <div className="divide-y divide-steel/40">
                                        {activeSectorSteps.map((step, idx) => {
                                            const card = allCards.find(c => c.id === selectedGanttCardId);
                                            if (!card) return null;

                                            const sequentialStepDates = getSequentialDatesForWorkflow(card);
                                            const stepDates = sequentialStepDates[idx];
                                            const isPastStep = idx < card.currentStepIndex;
                                            const isActiveStep = idx === card.currentStepIndex;

                                            let stepProgressPercent = 0;
                                            let barColorTheme = "from-slate-800/40 to-slate-700/30 text-slate-500 border border-steel/50 cursor-not-allowed";
                                            if (isPastStep) {
                                                stepProgressPercent = 100;
                                                barColorTheme = "from-emerald-600/90 to-emerald-500/80 text-white shadow-[0_0_10px_rgba(16,185,129,0.15)]";
                                            } else if (isActiveStep) {
                                                const subtasks = card.subtasks || [];
                                                const total = subtasks.length;
                                                const done = subtasks.filter(s => s.done).length;
                                                stepProgressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
                                                barColorTheme = "from-fire to-fire-hover text-white shadow-[0_0_12px_rgba(255,107,26,0.25)]";
                                            }

                                            // Date plotting ranges
                                            const startFormatted = stepDates.startDateStr.split('-').reverse().slice(0, 2).join('/');
                                            const endFormatted = stepDates.endDateStr.split('-').reverse().slice(0, 2).join('/');
                                            const datesRangeHTML = stepDates.duration <= 3 ? endFormatted : `${startFormatted} - ${endFormatted}`;

                                            // Horizontal coordinate offsets
                                            const gStartVal = gStart.getTime();
                                            const cStartVal = stepDates.startDate.getTime();
                                            let gridStartCol = 1;
                                            if (cStartVal >= gStartVal) {
                                                const diffTime = Math.abs(cStartVal - gStartVal);
                                                gridStartCol = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                            }

                                            return (
                                                <div key={step.step} className="grid grid-cols-[240px_1fr] bg-dark/20 items-center text-xs h-16">
                                                    <div className="p-3 border-r border-steel flex flex-col justify-center h-full">
                                                        <span className="font-bold text-white font-condensed tracking-wide uppercase">{step.stageName}</span>
                                                    </div>
                                                    <div className="grid h-full items-center p-2 relative font-mono" style={{ gridTemplateColumns: 'repeat(21, minmax(0, 1fr))' }}>
                                                        <div id={`gantt-bar-step-${step.step}`} className={`relative bg-gradient-to-r ${barColorTheme} h-7 rounded-full flex items-center justify-between px-3 text-[10px] font-bold border border-white/15 group cursor-pointer overflow-hidden`} style={{ gridColumn: `${gridStartCol} / span ${stepDates.duration}` }} onClick={() => openViewCardModal(card.id)}>
                                                            <div className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-300" style={{ width: `${stepProgressPercent}%` }}></div>
                                                            <span className="z-10 font-black font-mono text-[10px] tracking-wide">{stepProgressPercent}%</span>
                                                            <span className="z-10 font-mono text-[8px] opacity-80 font-bold whitespace-nowrap">{datesRangeHTML}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* NEW CARD MODAL */}
            {isCardModalOpen && (
                <div className="fixed inset-0 bg-void/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    {/* Render Form fields tied to handleSaveNewCard */}
                </div>
            )}
        </div>
    );
}
