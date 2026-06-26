// MASTER WORKFLOW SEQUENCER (UNIFIED SOP PIPELINE PROGRAMMED BY CLIENT)
let PROGRAMMED_WORKFLOW_PIPELINE = [
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
];

// Sectors definitions
let sectors = [
    { id: "vendas", name: "Vendas / Comercial", icon: "fa-users", color: "purple", budgetLimit: 500000.00 },
    { id: "financeiro", name: "Financeiro", icon: "fa-file-invoice-dollar", color: "emerald", budgetLimit: 200000.00 },
    { id: "engenharia", name: "Engenharia", icon: "fa-hard-hat", color: "fire", budgetLimit: 90000.00 }
];

// Global list of cards in progress
let allCards = [
    {
        id: "card-1",
        title: "Obra Residencial Jardins - Unidade 302",
        desc: "Projeto padrão de incorporação cruzando todas as etapas sequenciais de processos e procedimentos da construtora.",
        responsible: "Juliana Torres",
        priority: "Média",
        startDate: "2026-06-25",
        date: "2026-07-15",
        cost: 450000.00,
        isWorkflowCard: true,
        currentStepIndex: 0, // step 1 (vendas - Captação & Leads)
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
        currentStepIndex: 4, // step 5 (engenharia - Execução de Sapatas)
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
];

const CRM_REMOTE_ENDPOINT = "/api/crm/focused";
const CRM_DEALS_ENDPOINT = "/api/crm/deals";
const REMOTE_STAGE_SEQUENCE = ["novos", "qualificacao", "proposta", "negociacao", "ganho"];
const REMOTE_STRUCTURE_LOCKED_MESSAGE = "A estrutura do pipeline do CRM focado ainda segue o backend atual. Edite cards e atividades; setores e POP ainda nao sao customizaveis por esta tela.";
let CURRENT_USER = { name: "Usuario", role: "Equipe", initials: "OC" };
let REMOTE_CAPABILITIES = { canEditStructure: false, canUploadAttachments: false };

// Active selected card for Gantt view filtering (NEW MULTI-PROJECT FEATURE)
let currentlySelectedGanttCardId = "card-1";

// Safe LocalStorage wrapper to avoid security crashes on direct local file execution
const safeStorage = {
    memoryStore: {},
    getItem: function(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return this.memoryStore[key] || null;
        }
    },
    setItem: function(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            this.memoryStore[key] = String(value);
        }
    }
};

// State Manager Loader
let activeSectorId = "vendas";
let currentlyDraggedCardId = null;
let currentlyDraggedSourceColumn = null;
let currentActiveView = "kanban";
let activeModalTab = "workflow";
let currentlySelectedDetailedCardId = null;

function mapPriorityToRemote(priority) {
    if (priority === "Alta") return "alta";
    if (priority === "Baixa") return "baixa";
    return "media";
}

function mapStepToRemoteStage(stepIndex) {
    return REMOTE_STAGE_SEQUENCE[stepIndex] || "novos";
}

function buildRemotePayloadFromCard(card) {
    return {
        nome: card.title,
        descricao: card.desc || "",
        stage: mapStepToRemoteStage(card.currentStepIndex),
        status: mapStepToRemoteStage(card.currentStepIndex) === "ganho" ? "ganho" : "aberto",
        priority: mapPriorityToRemote(card.priority),
        valor: Number(card.cost || 0),
        custom_fields: {
            start_date: card.startDate || "",
            end_date: card.date || "",
            responsavel: card.responsible || ""
        },
        playbook_items: (card.subtasks || []).map((sub) => ({
            id: sub.id,
            label: sub.title,
            done: Boolean(sub.done)
        }))
    };
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false || payload.success === false) {
        throw new Error(payload.message || payload.error || "Falha ao sincronizar CRM.");
    }
    return payload;
}

function applyCurrentUserUi() {
    const avatar = document.getElementById("crm-user-avatar");
    const name = document.getElementById("crm-user-name");
    const role = document.getElementById("crm-user-role");
    const commentAvatar = document.getElementById("crm-comment-avatar");
    if (avatar) avatar.textContent = CURRENT_USER.initials || "OC";
    if (name) name.textContent = CURRENT_USER.name || "Usuario";
    if (role) role.textContent = CURRENT_USER.role || "Equipe";
    if (commentAvatar) commentAvatar.textContent = CURRENT_USER.initials || "OC";
}

function applyCapabilitiesUi() {
    const workflowTrigger = document.getElementById("workflow-config-trigger");
    const newSectorTrigger = document.getElementById("new-sector-trigger");
    if (!REMOTE_CAPABILITIES.canEditStructure) {
        if (workflowTrigger) workflowTrigger.classList.add("hidden");
        if (newSectorTrigger) newSectorTrigger.classList.add("hidden");
    }
}

async function loadRemoteState(preferredCardId = null) {
    const payload = await apiRequest(CRM_REMOTE_ENDPOINT);
    PROGRAMMED_WORKFLOW_PIPELINE = payload.workflow || PROGRAMMED_WORKFLOW_PIPELINE;
    sectors = payload.sectors || sectors;
    allCards = payload.cards || [];
    CURRENT_USER = payload.user || CURRENT_USER;
    REMOTE_CAPABILITIES = payload.capabilities || REMOTE_CAPABILITIES;

    const savedActiveSec = safeStorage.getItem("obrascity_active_sec_id");
    const savedGanttCard = safeStorage.getItem("obrascity_gantt_card_id");

    if (preferredCardId && allCards.some((card) => card.id === preferredCardId)) {
        currentlySelectedGanttCardId = preferredCardId;
    } else if (savedGanttCard && allCards.some((card) => card.id === savedGanttCard)) {
        currentlySelectedGanttCardId = savedGanttCard;
    } else if (allCards.length > 0) {
        currentlySelectedGanttCardId = allCards[0].id;
    }

    if (savedActiveSec && sectors.some((sector) => sector.id === savedActiveSec)) {
        activeSectorId = savedActiveSec;
    } else if (allCards.length > 0) {
        const activeCard = allCards.find((card) => card.id === currentlySelectedGanttCardId) || allCards[0];
        activeSectorId = PROGRAMMED_WORKFLOW_PIPELINE[activeCard.currentStepIndex]?.sectorId || sectors[0]?.id || "vendas";
    } else {
        activeSectorId = sectors[0]?.id || "vendas";
    }

    applyCurrentUserUi();
    applyCapabilitiesUi();
    saveToLocalStorage();
    renderSectorsList();
    if (currentActiveView === "gantt") {
        renderGanttTimeline();
    } else {
        renderActiveSectorBoard();
    }
}

async function syncCardRemote(card, options = {}) {
    const payload = buildRemotePayloadFromCard(card);
    if (card.id && String(card.id).startsWith("card-")) {
        throw new Error("Card local sem vinculo remoto nao pode ser sincronizado.");
    }

    if (card.id) {
        await apiRequest(`${CRM_DEALS_ENDPOINT}/${card.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload)
        });
    } else {
        await apiRequest(CRM_DEALS_ENDPOINT, {
            method: "POST",
            body: JSON.stringify({ intent: "create", ...payload })
        });
    }

    await loadRemoteState(options.preferredCardId || card.id || null);
}

async function initApp() {
    try {
        await loadRemoteState();
    } catch (error) {
        console.error("Falha ao carregar CRM remoto:", error);
        const savedCards = safeStorage.getItem("obrascity_all_cards");
        const savedWorkflow = safeStorage.getItem("obrascity_programmed_workflow");
        const savedSectors = safeStorage.getItem("obrascity_sectors_list");
        const savedActiveSec = safeStorage.getItem("obrascity_active_sec_id");
        const savedGanttCard = safeStorage.getItem("obrascity_gantt_card_id");

        if (savedCards) allCards = JSON.parse(savedCards);
        if (savedWorkflow) PROGRAMMED_WORKFLOW_PIPELINE = JSON.parse(savedWorkflow);
        if (savedSectors) sectors = JSON.parse(savedSectors);
        if (savedGanttCard && allCards.some(c => c.id === savedGanttCard)) {
            currentlySelectedGanttCardId = savedGanttCard;
        } else if (allCards.length > 0) {
            currentlySelectedGanttCardId = allCards[0].id;
        }
        
        if (savedActiveSec && sectors.some(s => s.id === savedActiveSec)) {
            activeSectorId = savedActiveSec;
        } else if (sectors.length > 0) {
            activeSectorId = sectors[0].id;
        }

        renderSectorsList();
        renderActiveSectorBoard();
        alert("Nao foi possivel carregar o CRM real agora. A interface abriu com cache local.");
    }
}

function saveToLocalStorage() {
    safeStorage.setItem("obrascity_all_cards", JSON.stringify(allCards));
    safeStorage.setItem("obrascity_programmed_workflow", JSON.stringify(PROGRAMMED_WORKFLOW_PIPELINE));
    safeStorage.setItem("obrascity_sectors_list", JSON.stringify(sectors));
    safeStorage.setItem("obrascity_active_sec_id", activeSectorId);
    safeStorage.setItem("obrascity_gantt_card_id", currentlySelectedGanttCardId);
}

// Toggle Form fields inside Card creation modal
function toggleWorkflowFormFields() {
    const type = document.getElementById("card-workflow-type").value;
    const colWrapper = document.getElementById("col-initial-wrapper");
    
    if (type === "programado") {
        colWrapper.classList.add("hidden");
        document.getElementById("card-column").value = "inprogress";
    } else {
        colWrapper.classList.remove("hidden");
    }
}

// SOP TEMPLATE APPLIER
function applySOPTemplate() {
    const selectedSOP = document.getElementById("card-sop").value;
    const titleInput = document.getElementById("card-title");
    const descInput = document.getElementById("card-desc");
    const feedbackText = document.getElementById("sop-feedback");
    const feedbackCount = document.getElementById("sop-feedback-count");

    if (selectedSOP === "none") {
        feedbackText.classList.add("hidden");
        return;
    }

    const template = SOP_TEMPLATES[selectedSOP];
    if (template) {
        descInput.value = template.desc;
        
        if (titleInput.value.trim() === "") {
            if (selectedSOP === "concretagem") titleInput.value = "Concretagem Estrutural - Bloco [X]";
            if (selectedSOP === "medicao") titleInput.value = "Auditoria de Medição - [Empreiteiro]";
            if (selectedSOP === "suprimentos") titleInput.value = "Geração de Ordem de Compra - [Material]";
            if (selectedSOP === "alvenaria") titleInput.value = "Verificação de Prumo Alvenaria - Pavimento [Y]";
        }

        feedbackCount.textContent = template.subtasks.length;
        feedbackText.classList.remove("hidden");
    }
}

// VIEW SWITCHER ENGINE (KANBAN <-> GANTT)
function switchView(viewName) {
    currentActiveView = viewName;
    
    const kanbanBtn = document.getElementById("view-kanban-btn");
    const ganttBtn = document.getElementById("view-gantt-btn");
    const kanbanBoard = document.getElementById("kanban-board");
    const ganttBoard = document.getElementById("gantt-board-view");

    if (viewName === "kanban") {
        kanbanBtn.className = "relative z-10 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center space-x-1.5 h-7 bg-gradient-to-r from-fire to-fire-hover text-white shadow-[0_2px_8px_rgba(255,107,26,0.3)]";
        ganttBtn.className = "relative z-10 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center space-x-1.5 h-7 text-muted hover:text-white";
        
        kanbanBoard.classList.remove("hidden");
        kanbanBoard.classList.add("flex");
        ganttBoard.classList.add("hidden");
        renderActiveSectorBoard();
    } else {
        ganttBtn.className = "relative z-10 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center space-x-1.5 h-7 bg-gradient-to-r from-fire to-fire-hover text-white shadow-[0_2px_8px_rgba(255,107,26,0.3)]";
        kanbanBtn.className = "relative z-10 px-3.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center space-x-1.5 h-7 text-muted hover:text-white";
        
        kanbanBoard.classList.add("hidden");
        kanbanBoard.classList.remove("flex");
        ganttBoard.classList.remove("hidden");
        renderGanttTimeline();
    }
}

// Helper to dynamically calculate consecutive Finish-to-Start step dates for a card!
function getSequentialDatesForWorkflow(card) {
    let dates = [];
    let currentStart = new Date(card.startDate + "T00:00:00");
    
    PROGRAMMED_WORKFLOW_PIPELINE.forEach((step, idx) => {
        let durationDays = 4; // default duration per phase for beautiful grid plotting
        if (step.step === 1) durationDays = 3;
        if (step.step === 3) durationDays = 5;
        if (step.step === 5) durationDays = 5;
        
        let start = new Date(currentStart);
        let end = new Date(start);
        end.setDate(start.getDate() + durationDays - 1);
        
        dates.push({
            step: step.step,
            startDateStr: start.toISOString().split('T')[0],
            endDateStr: end.toISOString().split('T')[0],
            startDate: start,
            endDate: end,
            duration: durationDays
        });
        
        // Next sequential step starts exactly 1 day after the previous step ends!
        currentStart = new Date(end);
        currentStart.setDate(end.getDate() + 1);
    });
    
    return dates;
}

// GANTT RENDERING ENGINE (REMODELED FOR SEQUENTIAL PROCESS TIMELINE PER CARD WITH DEPENDENCY ARROWS!)
function renderGanttTimeline() {
    const rowsContainer = document.getElementById("gantt-rows-container");
    rowsContainer.innerHTML = "";

    if (allCards.length === 0) {
        rowsContainer.innerHTML = `
            <div class="p-8 text-center text-xs text-muted font-sans">
                Nenhum projeto cadastrado no sistema para exibir o Cronograma de Gantt.
            </div>
        `;
        return;
    }

    // Render multi-project selector tabs!
    let selectorHTML = `
        <div class="p-4 bg-dark2/40 border-b border-steel flex items-center space-x-3 flex-wrap">
            <span class="text-xs text-muted font-bold uppercase tracking-wider">Visualizar Cronograma da Obra:</span>
            <div class="flex items-center space-x-1.5 p-1 bg-dark rounded-lg border border-steel">
    `;

    allCards.forEach(c => {
        const isSelected = c.id === currentlySelectedGanttCardId;
        selectorHTML += `
            <button onclick="selectGanttActiveProject('${c.id}')" class="px-3.5 py-1 rounded text-xs font-bold transition ${isSelected ? 'bg-fire text-white' : 'text-muted hover:text-white hover:bg-steel/30'}">
                <i class="fa-solid fa-hotel mr-1"></i> ${c.title.split(' - ')[0]}
            </button>
        `;
    });

    selectorHTML += `</div></div>`;

    // Append project selectors
    const ganttBoardView = document.getElementById("gantt-board-view");
    // Ensure we don't duplicate selectors
    let existingSelector = ganttBoardView.querySelector(".bg-dark2\\/40");
    if (existingSelector) existingSelector.remove();
    ganttBoardView.insertBefore(document.createRange().createContextualFragment(selectorHTML), ganttBoardView.children[1]);

    // Query selected card data
    const selectedCard = allCards.find(c => c.id === currentlySelectedGanttCardId) || allCards[0];
    if (!selectedCard) return;

    // Calculate sequential critical path dates
    const sequentialStepDates = getSequentialDatesForWorkflow(selectedCard);

    // Reference timeline coordinates: Jun 25 to Jul 15 (21 days)
    const gStart = new Date("2026-06-25T00:00:00");
    const totalDaysInTimeline = 21;

    PROGRAMMED_WORKFLOW_PIPELINE.forEach((step, idx) => {
        const stepDates = sequentialStepDates[idx];
        const cStart = stepDates.startDate;
        const cEnd = stepDates.endDate;

        let gridStartCol = 1;
        let gridSpan = stepDates.duration;

        if (cStart >= gStart) {
            const diffTime = Math.abs(cStart - gStart);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            gridStartCol = diffDays + 1;
        } else {
            gridStartCol = 1;
        }

        // Restrict boundaries to fit 21 columns
        if (gridStartCol < 1) gridStartCol = 1;
        if (gridStartCol > totalDaysInTimeline) gridStartCol = totalDaysInTimeline;
        if (gridStartCol + gridSpan > totalDaysInTimeline + 1) {
            gridSpan = (totalDaysInTimeline + 1) - gridStartCol;
        }

        // Checklist completion per step
        const isPastStep = idx < selectedCard.currentStepIndex;
        const isActiveStep = idx === selectedCard.currentStepIndex;
        
        let stepProgressPercent = 0;
        let barColorTheme = "from-slate-800 to-slate-700 opacity-30 shadow-none border-dashed"; // Pending/Locked Step
        let badgeHTML = "";

        if (isPastStep) {
            stepProgressPercent = 100;
            barColorTheme = "from-emerald-600 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]";
            badgeHTML = `<span class="bg-emerald-950 text-emerald-400 border border-emerald-800/30 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase"><i class="fa-solid fa-circle-check"></i> Concluído</span>`;
        } else if (isActiveStep) {
            const subtasks = selectedCard.subtasks || [];
            const total = subtasks.length;
            const done = subtasks.filter(s => s.done).length;
            stepProgressPercent = total > 0 ? Math.round((done / total) * 100) : 0;
            
            barColorTheme = "from-[#FF6B1A] to-[#FF9445] shadow-[0_0_12px_rgba(255,107,26,0.4)] animate-pulse";
            badgeHTML = `<span class="bg-fire/10 text-fire border border-fire/20 text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">Ativo / Diário</span>`;
        } else {
            badgeHTML = `<span class="bg-steel/50 text-muted border border-steel text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase"><i class="fa-solid fa-lock"></i> Pendente</span>`;
        }

        const startFormatted = stepDates.startDateStr.split('-').reverse().slice(0,2).join('/'); // DD/MM
        const endFormatted = stepDates.endDateStr.split('-').reverse().slice(0,2).join('/'); // DD/MM
        
        let datesRangeHTML = "";
        if (stepDates.duration <= 3) {
            datesRangeHTML = `${endFormatted}`;
        } else {
            datesRangeHTML = `${startFormatted} - ${endFormatted}`;
        }

        const row = document.createElement("div");
        row.className = "grid grid-cols-[240px_1fr] bg-dark/20 hover:bg-dark2/20 items-center text-xs transition duration-150 relative h-16";
        
        row.innerHTML = `
            <!-- Left: Metadata -->
            <div class="p-3 border-r border-steel flex flex-col justify-center h-full">
                <div class="flex items-center space-x-2">
                    <span class="text-[10px] font-bold text-muted font-mono bg-steel/30 px-1.5 py-0.5 rounded">Fase ${step.step}</span>
                    <span class="font-bold text-white leading-tight uppercase font-condensed tracking-wide">${step.stageName}</span>
                </div>
                <div class="flex items-center space-x-1.5 mt-1">
                    <span class="text-[10px] text-muted font-sans uppercase">Responsável: <strong class="text-light">${selectedCard.responsible || 'Engenharia'}</strong></span>
                </div>
            </div>

            <!-- Right: Gantt Plot row -->
            <div class="grid h-full items-center p-2 relative font-mono" style="grid-template-columns: repeat(21, minmax(0, 1fr));">
                
                <!-- Grid lines -->
                <div class="absolute inset-0 grid pointer-events-none opacity-10" style="grid-template-columns: repeat(21, minmax(0, 1fr));">
                    ${Array(21).fill(0).map(() => `<div class="border-r border-steel h-full"></div>`).join('')}
                </div>

                <!-- Plotting timeline bar -->
                <div id="gantt-bar-step-${step.step}" class="relative bg-gradient-to-r ${barColorTheme} h-7 rounded-full flex items-center justify-between px-3 text-[10px] font-bold border border-white/15 group cursor-pointer overflow-hidden" 
                     style="grid-column: ${gridStartCol} / span ${gridSpan}"
                     onclick="openViewCardModal('${selectedCard.id}')">
                    
                    <!-- Progress Overlay (Clipped perfectly due to overflow-hidden!) -->
                    <div class="absolute inset-y-0 left-0 bg-white/20 transition-all duration-300" style="width: ${stepProgressPercent}%"></div>
                    
                    <!-- Compact Content -->
                    <span class="z-10 font-black font-mono text-[10px] tracking-wide">${stepProgressPercent}%</span>
                    <span class="z-10 font-mono text-[8px] opacity-80 font-bold whitespace-nowrap">${datesRangeHTML}</span>

                    <div class="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-void border border-steel text-light text-[9px] rounded py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition shadow-xl z-50 whitespace-nowrap">
                        <span class="font-bold text-fire">${step.stageName}</span> (${stepDates.duration} dias)
                    </div>
                </div>
            </div>
        `;

        rowsContainer.appendChild(row);
    });

    // Draw visual connecting lines (MS Project-style overlay!)
    setTimeout(drawGanttDependencyLines, 80);
}

function selectGanttActiveProject(cardId) {
    currentlySelectedGanttCardId = cardId;
    saveToLocalStorage();
    renderGanttTimeline();
}

// RENDERING SECTORS AND WORKSPACE
function renderSectorsList() {
    const container = document.getElementById("sectors-nav-list");
    container.innerHTML = "";

    sectors.forEach(sec => {
        const isActive = sec.id === activeSectorId;
        let activeClasses = "";
        let indicatorColor = "";
        
        if (sec.color === "fire") {
            activeClasses = isActive ? "bg-[#FF6B1A]/10 text-[#FF6B1A] border-l-4 border-[#FF6B1A] font-bold" : "text-muted hover:bg-steel/40 hover:text-white";
            indicatorColor = "bg-[#FF6B1A]";
        } else if (sec.color === "emerald") {
            activeClasses = isActive ? "bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500 font-bold" : "text-muted hover:bg-steel/40 hover:text-white";
            indicatorColor = "bg-emerald-500";
        } else if (sec.color === "cyan") {
            activeClasses = isActive ? "bg-cyan-500/10 text-cyan-400 border-l-4 border-cyan-500 font-bold" : "text-muted hover:bg-steel/40 hover:text-white";
            indicatorColor = "bg-cyan-500";
        } else if (sec.color === "purple") {
            activeClasses = isActive ? "bg-purple-500/10 text-purple-400 border-l-4 border-purple-500 font-bold" : "text-muted hover:bg-steel/40 hover:text-white";
            indicatorColor = "bg-purple-500";
        } else {
            activeClasses = isActive ? "bg-slate-400/10 text-slate-300 border-l-4 border-slate-400 font-bold" : "text-muted hover:bg-steel/40 hover:text-white";
            indicatorColor = "bg-slate-400";
        }

        const countOfCards = allCards.filter(card => {
            const step = PROGRAMMED_WORKFLOW_PIPELINE[card.currentStepIndex];
            return step && step.sectorId === sec.id;
        }).length;

        const navItem = document.createElement("button");
        navItem.className = `w-full text-left py-2.5 px-3 rounded-md transition duration-150 flex items-center justify-between group sector-badge ${activeClasses}`;
        navItem.onclick = () => switchActiveSector(sec.id);

        navItem.innerHTML = `
            <div class="flex items-center space-x-2.5 min-w-0">
                <i class="fa-solid ${sec.icon} text-sm flex-shrink-0"></i>
                <span class="truncate text-sm font-semibold tracking-wide">${sec.name}</span>
            </div>
            <div class="flex items-center space-x-2">
                <span class="w-1.5 h-1.5 rounded-full ${indicatorColor} ${isActive ? 'animate-pulse' : 'opacity-40'}"></span>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-void text-light/75 group-hover:bg-steel transition">${countOfCards}</span>
            </div>
        `;

        container.appendChild(navItem);
    });
}

function renderActiveSectorBoard() {
    const activeSector = sectors.find(s => s.id === activeSectorId);
    if (!activeSector) return;

    const iconContainer = document.getElementById("active-sector-header-icon-container");
    const iconEl = document.getElementById("active-sector-header-icon");
    const titleEl = document.getElementById("active-sector-header-title");

    titleEl.textContent = activeSector.name;
    iconEl.className = `fa-solid ${activeSector.icon} text-lg`;
    
    iconContainer.style.color = getHexForColor(activeSector.color);
    iconContainer.style.boxShadow = `0 0 15px ${getHexForColorLight(activeSector.color)}`;

    const boardContainer = document.getElementById("kanban-board");
    boardContainer.innerHTML = "";

    const columnsList = PROGRAMMED_WORKFLOW_PIPELINE.filter(step => step.sectorId === activeSectorId);

    columnsList.forEach((col, idx) => {
        const stepGlobalIndex = PROGRAMMED_WORKFLOW_PIPELINE.findIndex(s => s.step === col.step);
        const cardList = allCards.filter(card => card.currentStepIndex === stepGlobalIndex);

        let borderTheme = "border-steel";
        let bgTheme = "bg-dark/80";
        
        if (idx === 1) {
            borderTheme = "border-fire/50";
        } else if (idx === columnsList.length - 1) {
            borderTheme = "border-emerald-500/50";
        }

        const colElement = document.createElement("div");
        colElement.className = `w-72 flex-shrink-0 flex flex-col max-h-[calc(100vh-230px)] rounded-xl border ${borderTheme} shadow-2xl backdrop-blur-md ${bgTheme}`;
        
        colElement.setAttribute("data-col-id", `step-${col.step}`);
        colElement.setAttribute("data-step-index", stepGlobalIndex);
        colElement.addEventListener("dragover", dragOver);
        colElement.addEventListener("dragenter", dragEnter);
        colElement.addEventListener("dragleave", dragLeave);
        colElement.addEventListener("drop", dragDrop);

        // Column Header with rapid '+' card creation
        const colHeader = document.createElement("div");
        colHeader.className = `p-4 flex items-center justify-between border-b border-steel bg-dark2/45 rounded-t-xl`;
        colHeader.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="text-xs font-bold text-fire font-mono bg-fire/5 border border-fire/15 px-1.5 py-0.5 rounded">Fase ${col.step}</span>
                <span class="font-bold text-white text-sm tracking-wide font-condensed uppercase">${col.stageName}</span>
                <span class="text-[10px] font-mono font-bold text-light bg-steel px-2 py-0.5 rounded-full" id="count-step-${col.step}">${cardList.length}</span>
            </div>
            <button onclick="openNewCardModal(${stepGlobalIndex})" class="text-muted hover:text-fire transition flex items-center justify-center p-1 hover:bg-steel/30 rounded" title="Criar card nesta fase">
                <i class="fa-solid fa-plus-circle text-base"></i>
            </button>
        `;

        // Card container
        const cardContainer = document.createElement("div");
        cardContainer.className = "flex-1 overflow-y-auto p-3 space-y-3";
        cardContainer.id = `col-list-step-${col.step}`;

        cardList.forEach(card => {
            const cardEl = renderCardElement(card, `step-${col.step}`);
            cardContainer.appendChild(cardEl);
        });

        if (cardList.length === 0) {
            const emptyEl = document.createElement("div");
            emptyEl.className = "text-center py-8 text-xs text-muted border border-dashed border-steel rounded-lg bg-dark2/10";
            emptyEl.textContent = "Arraste ou inicie um card aqui.";
            cardContainer.appendChild(emptyEl);
        }

        colElement.appendChild(colHeader);
        colElement.appendChild(cardContainer);
        boardContainer.appendChild(colElement);
    });

    updateStats(activeSector);
}

// DYNAMIC CARD ELEMENT RENDERER
function renderCardElement(card, columnId) {
    const cardEl = document.createElement("div");
    cardEl.className = "bg-dark2 p-4 rounded-xl border border-steel hover:border-fire/60 hover:shadow-[0_4px_16px_rgba(255,107,26,0.15)] hover:-translate-y-[1px] transition-all duration-150 cursor-grab active:cursor-grabbing relative group";
    cardEl.setAttribute("draggable", "true");
    cardEl.setAttribute("id", card.id);
    cardEl.setAttribute("data-col-id", columnId);

    cardEl.addEventListener("dragstart", dragStart);
    cardEl.addEventListener("dragend", dragEnd);
    cardEl.onclick = (e) => {
        if (!e.target.closest('.no-modal-trigger')) {
            openViewCardModal(card.id);
        }
    };

    let priorityBadge = "";
    let priorityBorder = "";
    if (card.priority === "Alta") {
        priorityBadge = "bg-rose-950/40 text-rose-400 border border-rose-900/30";
        priorityBorder = "border-l-4 border-l-rose-500";
    } else if (card.priority === "Média") {
        priorityBadge = "bg-amber-950/40 text-amber-400 border border-amber-900/30";
        priorityBorder = "border-l-4 border-l-amber-500";
    } else {
        priorityBadge = "bg-slate-900 text-muted border border-steel";
        priorityBorder = "border-l-4 border-l-slate-600";
    }

    cardEl.className += ` ${priorityBorder}`;

    let checklistSummaryHTML = "";
    const subtasks = card.subtasks || [];
    if (subtasks.length > 0) {
        const total = subtasks.length;
        const done = subtasks.filter(s => s.done).length;
        const percent = Math.round((done / total) * 100);
        
        checklistSummaryHTML = `
            <div class="space-y-1 pt-1.5 font-sans">
                <div class="flex justify-between text-[10px] text-muted">
                    <span class="flex items-center flex-wrap gap-1">
                        <i class="fa-solid fa-list-check text-[9px] text-fire"></i> 
                        <span>Checklist Procedimentos</span>
                    </span>
                    <span class="font-mono font-bold text-light">${done}/${total} (${percent}%)</span>
                </div>
                <div class="w-full bg-steel h-1 rounded-full overflow-hidden">
                    <div class="bg-fire h-full" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
    }

    const commentCount = (card.comments || []).length;
    const attachCount = (card.attachments || []).length;
    let badgesHTML = "";
    const signedBadge = card.fvsSigned ? `<span class="text-emerald-400" title="FVS Assinada e Homologada"><i class="fa-solid fa-stamp text-[10px] mr-1"></i></span>` : "";

    if (commentCount > 0 || attachCount > 0 || card.fvsSigned) {
        badgesHTML = `
            <div class="flex items-center space-x-2.5 text-[10px] text-muted pt-1 flex-wrap gap-1">
                ${signedBadge}
                ${commentCount > 0 ? `<span class="flex items-center"><i class="fa-regular fa-comment mr-1"></i>${commentCount}</span>` : ""}
                ${attachCount > 0 ? `<span class="flex items-center"><i class="fa-solid fa-paperclip mr-1"></i>${attachCount}</span>` : ""}
            </div>
        `;
    }

    const formattedCost = card.cost ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.cost) : "R$ 0,00";

    let dateBadge = "";
    if (card.date) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const cardDate = new Date(card.date + 'T00:00:00');
        
        let isOverdue = cardDate < today && columnId !== "done";
        let isNear = (cardDate - today) / (1000 * 60 * 60 * 24) <= 3 && columnId !== "done" && !isOverdue;
        const formattedDate = card.date.split('-').reverse().slice(0,2).join('/');

        if (isOverdue) {
            dateBadge = `<span class="inline-flex items-center text-[10px] font-bold text-rose-400 bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-900/40" title="Atrasado!"><i class="fa-solid fa-triangle-exclamation mr-1 text-[9px]"></i>${formattedDate}</span>`;
        } else if (isNear) {
            dateBadge = `<span class="inline-flex items-center text-[10px] font-bold text-amber-400 bg-amber-950/20 px-1.5 py-0.5 rounded border border-amber-900/40" title="Prazo limite chegando"><i class="fa-solid fa-clock mr-1 text-[9px]"></i>${formattedDate}</span>`;
        } else {
            dateBadge = `<span class="inline-flex items-center text-[10px] font-medium text-muted bg-steel/30 px-1.5 py-0.5 rounded border border-steel"><i class="fa-regular fa-calendar mr-1 text-[9px]"></i>${formattedDate}</span>`;
        }
    }

    const initials = card.responsible ? card.responsible.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : "S/R";

    cardEl.innerHTML = `
        <!-- Options button -->
        <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition duration-150 no-modal-trigger font-sans">
            <button onclick="editCard('${card.id}')" class="p-1 text-muted hover:text-fire transition bg-dark rounded border border-steel border-none" title="Editar Card">
                <i class="fa-solid fa-edit text-xs"></i>
            </button>
            <button onclick="deleteCard('${card.id}')" class="p-1 text-muted hover:text-red-400 transition bg-dark rounded border border-steel border-none" title="Excluir Card">
                <i class="fa-solid fa-trash text-xs"></i>
            </button>
        </div>

        <div class="space-y-2 font-sans">
            <h4 class="font-bold text-white text-sm leading-tight pr-6 break-words">${card.title}</h4>
            <p class="text-xs text-muted line-clamp-2 leading-relaxed break-words">${card.desc || 'Nenhuma descrição fornecida.'}</p>
            
            ${checklistSummaryHTML}

            <div class="flex items-center justify-between pt-2 border-t border-steel">
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${priorityBadge}">${card.priority}</span>
                    ${dateBadge}
                </div>
                ${badgesHTML}
            </div>

            <!-- Footnote: cost and responsible -->
            <div class="flex items-center justify-between pt-0.5">
                <span class="text-xs font-bold text-emerald-400">${formattedCost}</span>
                <div class="flex items-center space-x-1.5" title="Responsável: ${card.responsible || 'Sem Responsável'}">
                    <span class="w-5 h-5 rounded-full bg-steel border border-steel text-[10px] font-bold text-light flex items-center justify-center">${initials}</span>
                </div>
            </div>
        </div>
    `;

    return cardEl;
}

// DYNAMIC COLOR MAPPER FOR BRAND ACCENTS
function getHexForColor(col) {
    switch(col) {
        case "fire": return "#FF6B1A";
        case "emerald": return "#10B981";
        case "cyan": return "#06B6D4";
        case "purple": return "#A855F7";
        default: return "#94A3B8";
    }
}

function getHexForColorLight(col) {
    switch(col) {
        case "fire": return "rgba(255, 107, 26, 0.2)";
        case "emerald": return "rgba(16, 185, 129, 0.2)";
        case "cyan": return "rgba(6, 182, 212, 0.2)";
        case "purple": return "rgba(168, 85, 247, 0.2)";
        default: return "rgba(148, 163, 184, 0.2)";
    }
}

// DYNAMIC STATS WIDGET COUNTER
function updateStats(activeSector) {
    const allSectCards = allCards.filter(card => {
        const step = PROGRAMMED_WORKFLOW_PIPELINE[card.currentStepIndex];
        return step && step.sectorId === activeSector.id;
    });
    const totalCards = allSectCards.length;

    const totalCost = allSectCards.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const formattedCost = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCost);

    const completedCount = allSectCards.filter(card => {
        const subtasks = card.subtasks || [];
        return subtasks.length > 0 && subtasks.every(s => s.done);
    }).length;

    const completionRate = totalCards > 0 ? Math.round((completedCount / totalCards) * 100) : 0;
    const urgentCount = allSectCards.filter(c => c.priority === "Alta").length;

    document.getElementById("stat-total-cards").textContent = totalCards;
    document.getElementById("stat-total-cost").textContent = formattedCost;
    document.getElementById("stat-completion-rate").textContent = `${completionRate}%`;
    document.getElementById("stat-high-priority").textContent = urgentCount;

    const warningBadge = document.getElementById("cost-warning-badge");
    const sectorBudgetLimit = activeSector.budgetLimit || 0;
    if (sectorBudgetLimit > 0 && totalCost > sectorBudgetLimit) {
        warningBadge.classList.remove("hidden");
        warningBadge.title = `Orçamento da área excedido! Limite era de R$ ${sectorBudgetLimit.toLocaleString('pt-BR')}`;
    } else {
        warningBadge.classList.add("hidden");
    }
}

// DRAG & DROP ACTION LOGIC
function dragStart(e) {
    currentlyDraggedCardId = this.id;
    currentlyDraggedSourceColumn = this.getAttribute("data-col-id");
    this.classList.add("dragging");
    e.dataTransfer.setData("text/plain", this.id);
}

function dragEnd() {
    this.classList.remove("dragging");
    document.querySelectorAll("[data-col-id]").forEach(col => col.classList.remove("drag-over"));
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    this.classList.add("drag-over");
}

function dragLeave() {
    this.classList.remove("drag-over");
}

async function dragDrop(e) {
    this.classList.remove("drag-over");
    const colElement = e.target.closest("[data-col-id]");
    if (!colElement) return;

    const targetStepIndex = parseInt(colElement.getAttribute("data-step-index"));
    const cardObj = allCards.find(c => c.id === currentlyDraggedCardId);

    if (!cardObj || cardObj.currentStepIndex === targetStepIndex) return;

    const currentStep = PROGRAMMED_WORKFLOW_PIPELINE[cardObj.currentStepIndex];
    const targetStep = PROGRAMMED_WORKFLOW_PIPELINE[targetStepIndex];

    const subtasks = cardObj.subtasks || [];
    const done = subtasks.filter(s => s.done).length;
    const isCompleted = subtasks.length > 0 && done === subtasks.length;

    if (targetStepIndex > cardObj.currentStepIndex && !isCompleted) {
        alert(`⚠️ Bloqueio de Qualidade (FVS): Você precisa concluir todos os procedimentos obrigatórios da fase "${currentStep.stageName}" antes de avançar para "${targetStep.stageName}"!`);
        return;
    }

    cardObj.currentStepIndex = targetStepIndex;

    const nextStep = PROGRAMMED_WORKFLOW_PIPELINE[targetStepIndex];
    if (nextStep && nextStep.subtasks) {
        cardObj.subtasks = nextStep.subtasks.map((title, idx) => ({
            id: 'sub-' + Date.now() + '-' + idx,
            title: title,
            done: false
        }));
    } else {
        cardObj.subtasks = [];
    }

    if (!cardObj.logs) cardObj.logs = [];
    cardObj.logs.unshift({
        text: `Movido de "${currentStep.stageName}" para "${targetStep.stageName}"`,
        date: getCurrentTimestamp()
    });

    saveToLocalStorage();
    renderActiveSectorBoard();
    renderSectorsList();

    try {
        await syncCardRemote(cardObj, { preferredCardId: cardObj.id });
    } catch (error) {
        console.error("Falha ao mover card remoto:", error);
        alert(error.message || "Falha ao atualizar etapa do card no CRM real.");
    }
}

// ==========================================
// SINGLE WINDOW MASTER WORKFLOW CONFIGURATOR (SOP/POP TIMELINE)
// ==========================================
function openWorkflowConfigModal() {
    if (!REMOTE_CAPABILITIES.canEditStructure) {
        alert(REMOTE_STRUCTURE_LOCKED_MESSAGE);
        return;
    }
    renderMasterWorkflowBuilder();
    document.getElementById("workflow-config-modal").classList.remove("hidden");
}

function closeWorkflowConfigModal() {
    document.getElementById("workflow-config-modal").classList.add("hidden");
    saveToLocalStorage();
    renderActiveSectorBoard();
    renderSectorsList();
}

function renderMasterWorkflowBuilder() {
    const container = document.getElementById("workflow-pipeline-builder-container");
    container.innerHTML = "";

    PROGRAMMED_WORKFLOW_PIPELINE.forEach((step, idx) => {
        const stepRow = document.createElement("div");
        stepRow.className = "p-4 bg-dark2/60 border border-steel rounded-xl space-y-3 relative group/step";

        const isFirst = idx === 0;
        const isLast = idx === PROGRAMMED_WORKFLOW_PIPELINE.length - 1;

        stepRow.innerHTML = `
            <div class="flex items-center justify-between border-b border-steel/40 pb-2 flex-wrap gap-2">
                <div class="flex items-center space-x-2">
                    <span class="w-6 h-6 rounded-full bg-steel border border-fire/30 text-fire font-bold text-xs flex items-center justify-center font-mono">${step.step}</span>
                    <span class="text-xs font-bold text-white uppercase tracking-wider font-sans">Fase de Processo</span>
                </div>

                <div class="flex items-center space-x-1">
                    <button onclick="movePipelineStep(${idx}, -1)" ${isFirst ? 'disabled' : ''} class="p-1.5 bg-steel/30 text-light hover:text-fire transition disabled:opacity-20 rounded" title="Mover para cima">
                        <i class="fa-solid fa-arrow-up text-[10px]"></i>
                    </button>
                    <button onclick="movePipelineStep(${idx}, 1)" ${isLast ? 'disabled' : ''} class="p-1.5 bg-steel/30 text-light hover:text-fire transition disabled:opacity-20 rounded" title="Mover para baixo">
                        <i class="fa-solid fa-arrow-down text-[10px]"></i>
                    </button>
                    <button onclick="removePipelineStep(${idx})" class="p-1.5 bg-steel/30 text-muted hover:text-red-400 transition rounded" title="Excluir Etapa">
                        <i class="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-3">
                    <div>
                        <label class="block text-[9px] font-bold text-muted uppercase tracking-wider mb-1">Setor Responsável</label>
                        <select onchange="updatePipelineStepSector(${idx}, this.value)" class="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-dark text-light focus:outline-none focus:ring-1 focus:ring-fire transition font-sans">
                            <option value="vendas" ${step.sectorId === "vendas" ? "selected" : ""}>Vendas / Comercial</option>
                            <option value="financeiro" ${step.sectorId === "financeiro" ? "selected" : ""}>Financeiro</option>
                            <option value="engenharia" ${step.sectorId === "engenharia" ? "selected" : ""}>Engenharia</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[9px] font-bold text-muted uppercase tracking-wider mb-1">Nome do Processo / Coluna Kanban</label>
                        <input type="text" value="${step.stageName}" onchange="updatePipelineStepName(${idx}, this.value)" placeholder="Ex: Captação" class="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-dark text-light focus:outline-none focus:ring-1 focus:ring-fire transition font-bold uppercase tracking-wide">
                    </div>
                </div>

                <!-- NEW INTERACTIVE CHECKLIST BUILDER -->
                <div class="space-y-2">
                    <label class="block text-[9px] font-bold text-muted uppercase tracking-wider">Procedimentos Obrigatórios de Qualidade (Checklist)</label>
                    
                    <!-- Checklist Box -->
                    <div class="space-y-1.5 max-h-32 overflow-y-auto bg-dark p-2 rounded-lg border border-steel" id="pop-step-checklist-${step.step}">
                        <!-- Rendered dynamically -->
                    </div>

                    <!-- Input wrapper -->
                    <div class="flex items-center space-x-1.5">
                        <input type="text" id="new-pop-subtask-input-${step.step}" onkeydown="handlePopSubtaskKeydown(event, ${idx})" placeholder="Adicionar procedimento de qualidade..." class="flex-1 px-3 py-1.5 border border-steel bg-dark text-[11px] rounded-lg focus:outline-none text-white">
                        <button type="button" onclick="addSOPSubtaskToStep(${idx})" class="px-3 py-1.5 bg-steel hover:bg-steel/80 border border-steel hover:border-fire/40 text-fire rounded-lg text-xs font-bold transition flex items-center justify-center">
                            <i class="fa-solid fa-plus text-[10px]"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(stepRow);
        
        // Render subtasks immediately
        renderSOPSubtasksInBuilder(idx);
    });
}

// Subtask renderer in builder
function renderSOPSubtasksInBuilder(stepIdx) {
    const step = PROGRAMMED_WORKFLOW_PIPELINE[stepIdx];
    const container = document.getElementById(`pop-step-checklist-${step.step}`);
    if (!container) return;

    container.innerHTML = "";
    const subtasks = step.subtasks || [];

    if (subtasks.length === 0) {
        container.innerHTML = `<div class="text-[10px] text-muted italic p-1">Nenhum procedimento cadastrado. Adicione um acima!</div>`;
        return;
    }

    subtasks.forEach((sub, subIdx) => {
        const item = document.createElement("div");
        item.className = "flex items-center justify-between bg-dark2/60 px-2 py-1 rounded border border-steel/30 text-[11px] text-light";
        item.innerHTML = `
            <span class="truncate pr-2">${sub}</span>
            <button type="button" onclick="removeSOPSubtaskFromStep(${stepIdx}, ${subIdx})" class="text-muted hover:text-red-400 transition">
                <i class="fa-solid fa-times-circle"></i>
            </button>
        `;
        container.appendChild(item);
    });
}

function handlePopSubtaskKeydown(e, stepIdx) {
    if (e.key === "Enter") {
        e.preventDefault();
        addSOPSubtaskToStep(stepIdx);
    }
}

function addSOPSubtaskToStep(stepIdx) {
    const step = PROGRAMMED_WORKFLOW_PIPELINE[stepIdx];
    const input = document.getElementById(`new-pop-subtask-input-${step.step}`);
    const val = input.value.trim();
    if (!val) return;

    if (!step.subtasks) step.subtasks = [];
    step.subtasks.push(val);

    saveToLocalStorage();
    syncWorkflowChecklistToActiveCards(stepIdx); // Sync changes to live cards!
    input.value = "";
    renderSOPSubtasksInBuilder(stepIdx);
}

function removeSOPSubtaskFromStep(stepIdx, subIdx) {
    const step = PROGRAMMED_WORKFLOW_PIPELINE[stepIdx];
    if (!step.subtasks) return;

    step.subtasks.splice(subIdx, 1);
    saveToLocalStorage();
    syncWorkflowChecklistToActiveCards(stepIdx); // Sync changes to live cards!
    renderSOPSubtasksInBuilder(stepIdx);
}

// REAL-TIME SYNC FROM POP TEMPLATE TO ACTIVE PROJECT CARDS
function syncWorkflowChecklistToActiveCards(stepIdx) {
    const step = PROGRAMMED_WORKFLOW_PIPELINE[stepIdx];
    allCards.forEach(card => {
        if (card.currentStepIndex === stepIdx && !card.fvsSigned) {
            const oldSubtasks = card.subtasks || [];
            card.subtasks = step.subtasks.map(title => {
                const existing = oldSubtasks.find(s => s.title === title);
                return {
                    id: existing ? existing.id : 'sub-' + Math.random().toString().slice(-6),
                    title: title,
                    done: existing ? existing.done : false
                };
            });
        }
    });
    saveToLocalStorage();
}

function updatePipelineStepSector(idx, val) {
    PROGRAMMED_WORKFLOW_PIPELINE[idx].sectorId = val;
    
    // Sync colors/icons of standard sectors
    if (val === "vendas") { PROGRAMMED_WORKFLOW_PIPELINE[idx].color = "purple"; PROGRAMMED_WORKFLOW_PIPELINE[idx].icon = "fa-users"; }
    if (val === "financeiro") { PROGRAMMED_WORKFLOW_PIPELINE[idx].color = "emerald"; PROGRAMMED_WORKFLOW_PIPELINE[idx].icon = "fa-file-invoice-dollar"; }
    if (val === "engenharia") { PROGRAMMED_WORKFLOW_PIPELINE[idx].color = "fire"; PROGRAMMED_WORKFLOW_PIPELINE[idx].icon = "fa-hard-hat"; }

    saveToLocalStorage();
}

function updatePipelineStepName(idx, val) {
    if (!val.trim()) return;
    PROGRAMMED_WORKFLOW_PIPELINE[idx].stageName = val.trim();
    saveToLocalStorage();
}

function movePipelineStep(idx, direction) {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= PROGRAMMED_WORKFLOW_PIPELINE.length) return;

    const temp = PROGRAMMED_WORKFLOW_PIPELINE[idx];
    PROGRAMMED_WORKFLOW_PIPELINE[idx] = PROGRAMMED_WORKFLOW_PIPELINE[targetIdx];
    PROGRAMMED_WORKFLOW_PIPELINE[targetIdx] = temp;

    PROGRAMMED_WORKFLOW_PIPELINE.forEach((step, i) => {
        step.step = i + 1;
    });

    saveToLocalStorage();
    renderMasterWorkflowBuilder();
}

function removePipelineStep(idx) {
    if (PROGRAMMED_WORKFLOW_PIPELINE.length <= 1) {
        alert("O fluxo programado corporativo deve conter pelo menos uma fase sequencial ativa.");
        return;
    }

    if (!confirm(`Atenção: Ao remover esta fase, todos os cards ativos nela precisarão ter suas posições recalibradas. Confirmar exclusão?`)) {
        return;
    }

    PROGRAMMED_WORKFLOW_PIPELINE.splice(idx, 1);
    PROGRAMMED_WORKFLOW_PIPELINE.forEach((step, i) => {
        step.step = i + 1;
    });

    allCards.forEach(card => {
        if (card.currentStepIndex >= PROGRAMMED_WORKFLOW_PIPELINE.length) {
            card.currentStepIndex = PROGRAMMED_WORKFLOW_PIPELINE.length - 1;
        }
    });

    saveToLocalStorage();
    renderMasterWorkflowBuilder();
}

function addNewPipelineStep() {
    const stageName = prompt("Digite o nome do novo processo / coluna Kanban:", "Novo Processo");
    if (!stageName) return;

    const nextStepNum = PROGRAMMED_WORKFLOW_PIPELINE.length + 1;
    PROGRAMMED_WORKFLOW_PIPELINE.push({
        step: nextStepNum,
        sectorId: "vendas",
        stageName,
        icon: "fa-users",
        color: "purple",
        subtasks: [
            "Procedimento padrão de qualidade 1",
            "Procedimento padrão de qualidade 2"
        ]
    });

    saveToLocalStorage();
    renderMasterWorkflowBuilder();
}

// ==========================================
// CARD OPERATIONS & DIALS
// ==========================================
function openNewCardModal(preselectedStepIndex = null) {
    document.getElementById("edit-card-id").value = "";
    document.getElementById("card-title").value = "";
    document.getElementById("card-responsible").value = "";
    
    const stepSelector = document.getElementById("card-start-step-selector");
    stepSelector.innerHTML = "";
    PROGRAMMED_WORKFLOW_PIPELINE.forEach((step, idx) => {
        stepSelector.innerHTML += `<option value="${idx}">Fase ${step.step}: [${step.sectorId.toUpperCase()}] ${step.stageName}</option>`;
    });

    if (preselectedStepIndex !== undefined && preselectedStepIndex !== null) {
        stepSelector.value = preselectedStepIndex;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const endProj = new Date();
    endProj.setDate(endProj.getDate() + 5);
    const endProjStr = endProj.toISOString().split('T')[0];

    document.getElementById("card-start-date").value = todayStr;
    document.getElementById("card-date").value = endProjStr;
    
    document.getElementById("card-cost").value = "";
    document.getElementById("card-desc").value = "";
    document.getElementById("save-card-btn").textContent = "Salvar Card";

    document.getElementById("new-card-modal").classList.remove("hidden");
}

function closeNewCardModal() {
    document.getElementById("new-card-modal").classList.add("hidden");
}

async function saveNewCard(e) {
    e.preventDefault();
    const activeSector = sectors.find(s => s.id === activeSectorId);
    if (!activeSector) return;

    const editCardId = document.getElementById("edit-card-id").value;
    const title = document.getElementById("card-title").value.trim();
    const responsible = document.getElementById("card-responsible").value.trim();
    const targetStepIndex = parseInt(document.getElementById("card-start-step-selector").value);
    const priority = document.getElementById("card-priority").value;
    const startDate = document.getElementById("card-start-date").value;
    const date = document.getElementById("card-date").value;
    const cost = parseFloat(document.getElementById("card-cost").value) || 0;
    const desc = document.getElementById("card-desc").value.trim();

    const selectedStepObj = PROGRAMMED_WORKFLOW_PIPELINE[targetStepIndex];

    let targetCardId = editCardId || null;
    if (editCardId) {
        const cardObj = allCards.find(c => c.id === editCardId);
        if (cardObj) {
            cardObj.title = title;
            cardObj.responsible = responsible;
            cardObj.priority = priority;
            cardObj.startDate = startDate;
            cardObj.date = date;
            cardObj.cost = cost;
            cardObj.desc = desc;

            if (cardObj.currentStepIndex !== targetStepIndex) {
                cardObj.currentStepIndex = targetStepIndex;
                cardObj.subtasks = selectedStepObj.subtasks.map((t, i) => ({
                    id: 'sub-' + Date.now() + '-' + i,
                    title: t,
                    done: false
                }));
            }

            if (!cardObj.logs) cardObj.logs = [];
            cardObj.logs.unshift({ text: "Atividade atualizada por Ricardo Santos", date: getCurrentTimestamp() });
            targetCardId = cardObj.id;
        }
    } else {
        const generatedSubtasks = selectedStepObj.subtasks.map((t, idx) => ({
            id: 'sub-' + Date.now() + '-' + idx,
            title: t,
            done: false
        }));

        const newCard = {
            id: 'card-' + Date.now(),
            title,
            desc: desc || `Procedimento padrão para a fase ${selectedStepObj.stageName}`,
            responsible,
            priority,
            startDate,
            date,
            cost,
            fvsSigned: false,
            isWorkflowCard: true,
            currentStepIndex: targetStepIndex,
            subtasks: generatedSubtasks,
            comments: [],
            logs: [{ text: `Card iniciado na Fase ${selectedStepObj.step}: ${selectedStepObj.stageName} [Setor: ${selectedStepObj.sectorId.toUpperCase()}]`, date: getCurrentTimestamp() }],
            attachments: []
        };

        allCards.push(newCard);
        activeSectorId = selectedStepObj.sectorId;
    }

    saveToLocalStorage();
    closeNewCardModal();
    
    if (currentActiveView === "kanban") {
        renderActiveSectorBoard();
    } else {
        renderGanttTimeline();
    }
    renderSectorsList();

    try {
        if (targetCardId) {
            const cardObj = allCards.find(c => c.id === targetCardId);
            if (cardObj) {
                await syncCardRemote(cardObj, { preferredCardId: targetCardId });
            }
        } else {
            const latestCard = allCards[allCards.length - 1];
            await apiRequest(CRM_DEALS_ENDPOINT, {
                method: "POST",
                body: JSON.stringify({ intent: "create", ...buildRemotePayloadFromCard(latestCard) })
            });
            await loadRemoteState();
        }
    } catch (error) {
        console.error("Falha ao salvar card remoto:", error);
        alert(error.message || "Falha ao salvar card no CRM real.");
    }
}

function editCard(cardId) {
    const cardObj = allCards.find(c => c.id === cardId);
    if (!cardObj) return;

    document.getElementById("edit-card-id").value = cardObj.id;
    document.getElementById("card-title").value = cardObj.title;
    document.getElementById("card-responsible").value = cardObj.responsible || "";
    
    const stepSelector = document.getElementById("card-start-step-selector");
    stepSelector.innerHTML = "";
    PROGRAMMED_WORKFLOW_PIPELINE.forEach((step, idx) => {
        stepSelector.innerHTML += `<option value="${idx}">${step.step}. [${step.sectorId.toUpperCase()}] ${step.stageName}</option>`;
    });
    stepSelector.value = cardObj.currentStepIndex;
    
    document.getElementById("card-start-date").value = cardObj.startDate || "2026-06-25";
    document.getElementById("card-date").value = cardObj.date || "2026-06-25";
    
    document.getElementById("card-cost").value = cardObj.cost || "";
    document.getElementById("card-desc").value = cardObj.desc || "";
    
    document.getElementById("save-card-btn").textContent = "Atualizar Card";

    document.getElementById("new-card-modal").classList.remove("hidden");
}

async function deleteCard(cardId) {
    if (!confirm("Tem certeza que deseja excluir esta atividade de forma definitiva?")) return;

    const idx = allCards.findIndex(c => c.id === cardId);
    if (idx !== -1) {
        allCards.splice(idx, 1);
    }

    saveToLocalStorage();
    if (currentActiveView === "kanban") {
        renderActiveSectorBoard();
    } else {
        renderGanttTimeline();
    }
    renderSectorsList();

    try {
        await apiRequest(`${CRM_DEALS_ENDPOINT}/${cardId}`, { method: "DELETE" });
        await loadRemoteState();
    } catch (error) {
        console.error("Falha ao excluir card remoto:", error);
        alert(error.message || "Falha ao excluir card no CRM real.");
    }
}

// ==========================================
// SECTOR OPERATIONS
// ==========================================
function switchActiveSector(sectorId) {
    activeSectorId = sectorId;
    saveToLocalStorage();
    renderSectorsList();
    
    if (currentActiveView === "kanban") {
        renderActiveSectorBoard();
    } else {
        renderGanttTimeline();
    }
}

function openNewSectorModal() {
    if (!REMOTE_CAPABILITIES.canEditStructure) {
        alert(REMOTE_STRUCTURE_LOCKED_MESSAGE);
        return;
    }
    document.getElementById("edit-sector-id").value = "";
    document.getElementById("sector-name").value = "";
    document.getElementById("new-sector-modal").classList.remove("hidden");
}

function openEditSectorModal() {
    if (!REMOTE_CAPABILITIES.canEditStructure) {
        alert(REMOTE_STRUCTURE_LOCKED_MESSAGE);
        return;
    }
    const activeSector = sectors.find(s => s.id === activeSectorId);
    if (!activeSector) return;

    document.getElementById("edit-sector-id").value = activeSector.id;
    document.getElementById("sector-name").value = activeSector.name;

    document.getElementById("new-sector-modal").classList.remove("hidden");
    toggleSectorDropdown();
}

function closeNewSectorModal() {
    document.getElementById("new-sector-modal").classList.add("hidden");
}

function saveSector(e) {
    if (!REMOTE_CAPABILITIES.canEditStructure) {
        e.preventDefault();
        alert(REMOTE_STRUCTURE_LOCKED_MESSAGE);
        return;
    }
    e.preventDefault();
    const editSectorId = document.getElementById("edit-sector-id").value;
    const name = document.getElementById("sector-name").value.trim();

    if (editSectorId) {
        const sec = sectors.find(s => s.id === editSectorId);
        if (sec) {
            sec.name = name;
        }
    } else {
        const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
        sectors.push({
            id: newId,
            name,
            icon: "fa-hard-hat",
            color: "fire"
        });
        activeSectorId = newId;
    }

    saveToLocalStorage();
    closeNewSectorModal();
    renderSectorsList();
    
    if (currentActiveView === "kanban") {
        renderActiveSectorBoard();
    } else {
        renderGanttTimeline();
    }
}

function deleteActiveSector() {
    if (!REMOTE_CAPABILITIES.canEditStructure) {
        alert(REMOTE_STRUCTURE_LOCKED_MESSAGE);
        return;
    }
    const activeSector = sectors.find(s => s.id === activeSectorId);
    if (!activeSector) return;

    if (sectors.length <= 1) {
        alert("Você precisa manter pelo menos um sector ativo no sistema.");
        toggleSectorDropdown();
        return;
    }

    if (!confirm(`Deseja realmente EXCLUIR o setor "${activeSector.name}"? Isso também removerá todas as fases do fluxo programado vinculadas a este setor!`)) {
        toggleSectorDropdown();
        return;
    }

    sectors = sectors.filter(s => s.id !== activeSectorId);
    PROGRAMMED_WORKFLOW_PIPELINE = PROGRAMMED_WORKFLOW_PIPELINE.filter(step => step.sectorId !== activeSectorId);
    
    PROGRAMMED_WORKFLOW_PIPELINE.forEach((step, i) => {
        step.step = i + 1;
    });

    allCards.forEach(card => {
        if (card.currentStepIndex >= PROGRAMMED_WORKFLOW_PIPELINE.length) {
            card.currentStepIndex = PROGRAMMED_WORKFLOW_PIPELINE.length - 1;
        }
    });

    activeSectorId = sectors[0].id;

    saveToLocalStorage();
    toggleSectorDropdown();
    renderSectorsList();
    if (currentActiveView === "kanban") {
        renderActiveSectorBoard();
    } else {
        renderGanttTimeline();
    }
}

function toggleSectorDropdown() {
    const dropdown = document.getElementById("sector-options-dropdown");
    dropdown.classList.toggle("hidden");
}

// ==========================================
// DETAILED CARD VIEW MODAL INTERACTIVE PLOTS
// ==========================================
function openViewCardModal(cardId) {
    currentlySelectedDetailedCardId = cardId;
    const cardObj = allCards.find(c => c.id === cardId);
    if (!cardObj) return;

    const isSigned = cardObj.fvsSigned === true;

    const titleEl = document.getElementById("view-card-title");
    const editBtn = document.getElementById("view-edit-btn");
    const deleteBtn = document.getElementById("view-delete-btn");
    const subtaskWrapper = document.getElementById("subtask-add-control-wrapper");
    const fvsBadge = document.getElementById("fvs-badge-modal");

    const currentStep = PROGRAMMED_WORKFLOW_PIPELINE[cardObj.currentStepIndex];
    const colTitle = currentStep ? currentStep.stageName : "Fase";

    titleEl.textContent = cardObj.title;
    document.getElementById("view-card-id").textContent = cardObj.id;
    document.getElementById("view-card-responsible").textContent = cardObj.responsible || "Sem Responsável";
    
    const initials = cardObj.responsible ? cardObj.responsible.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : "S/R";
    document.getElementById("view-card-avatar").textContent = initials;

    const startDFormatted = cardObj.startDate ? cardObj.startDate.split('-').reverse().join('/') : "---";
    const endDFormatted = cardObj.date ? cardObj.date.split('-').reverse().join('/') : "---";
    document.getElementById("view-card-date").textContent = `${startDFormatted} - ${endDFormatted}`;

    document.getElementById("view-card-column").textContent = colTitle;
    document.getElementById("view-card-desc").textContent = cardObj.desc || "Nenhuma descrição detalhada fornecida.";

    const formattedCost = cardObj.cost ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cardObj.cost) : "R$ 0,00";
    document.getElementById("view-card-cost").textContent = formattedCost;

    const tagContainer = document.getElementById("view-card-tag");
    tagContainer.textContent = cardObj.priority;
    tagContainer.className = "px-2.5 py-1 rounded text-xs font-bold tracking-wide uppercase";
    if (cardObj.priority === "Alta") {
        tagContainer.classList.add("bg-rose-950/45", "text-rose-400");
    } else if (cardObj.priority === "Média") {
        tagContainer.classList.add("bg-amber-950/45", "text-amber-400");
    } else {
        tagContainer.classList.add("bg-slate-900", "text-muted", "border", "border-steel");
    }

    if (isSigned) {
        fvsBadge.classList.remove("hidden");
        editBtn.classList.add("opacity-50", "pointer-events-none");
        deleteBtn.classList.add("opacity-50", "pointer-events-none");
        subtaskWrapper.classList.add("hidden");
    } else {
        fvsBadge.classList.add("hidden");
        editBtn.classList.remove("opacity-50", "pointer-events-none");
        deleteBtn.classList.remove("opacity-50", "pointer-events-none");
        subtaskWrapper.classList.remove("hidden");
    }

    const journeyTracker = document.getElementById("workflow-journey-tracker");
    if (cardObj.isWorkflowCard) {
        journeyTracker.classList.remove("hidden");
        renderWorkflowJourneyNodes(cardObj);
    } else {
        journeyTracker.classList.add("hidden");
    }

    renderDetailedSubtasks(cardObj);
    renderDetailedComments(cardObj);
    renderDetailedLogs(cardObj);
    renderDetailedAttachments(cardObj);
    renderFVSSignaturePanel(cardObj);
    renderWorkflowPromotionPanel(cardObj);

    document.getElementById("view-card-modal").classList.remove("hidden");
}

function closeViewCardModal() {
    document.getElementById("view-card-modal").classList.add("hidden");
    currentlySelectedDetailedCardId = null;
}

function editCardFromDetails() {
    const idToEdit = currentlySelectedDetailedCardId;
    closeViewCardModal();
    editCard(idToEdit);
}

function deleteCardFromDetails() {
    const idToDelete = currentlySelectedDetailedCardId;
    closeViewCardModal();
    deleteCard(idToDelete);
}

// ==========================================
// DETAIL MODAL LOGIC: SUBTASKS, COMMENTS, LOGS, ATTACHMENTS
// ==========================================
function getActiveCard() {
    if (!currentlySelectedDetailedCardId) return null;
    return allCards.find(c => c.id === currentlySelectedDetailedCardId) || null;
}

function renderWorkflowJourneyNodes(cardObj) {
    const container = document.getElementById("workflow-steps-progress-nodes");
    container.innerHTML = "";

    PROGRAMMED_WORKFLOW_PIPELINE.forEach((step, idx) => {
        const isPast = idx < cardObj.currentStepIndex;
        const isActive = idx === cardObj.currentStepIndex;
        
        let nodeClass = "text-muted opacity-40";
        if (isPast) nodeClass = "text-emerald-400 font-bold font-condensed";
        if (isActive) nodeClass = "text-fire font-black border-b border-fire pb-0.5 font-condensed";

        const node = document.createElement("div");
        node.className = `flex items-center space-x-1 ${nodeClass}`;
        node.innerHTML = `
            <span>${step.step}. ${step.stageName}</span>
            ${idx < PROGRAMMED_WORKFLOW_PIPELINE.length - 1 ? `<span class="mx-1 text-slate-600 font-normal">➜</span>` : ''}
        `;
        container.appendChild(node);
    });
}

function renderDetailedSubtasks(cardObj) {
    const subtasks = cardObj.subtasks || [];
    const container = document.getElementById("subtasks-list-container");
    container.innerHTML = "";

    const total = subtasks.length;
    const done = subtasks.filter(s => s.done).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    document.getElementById("subtasks-progress-text").textContent = `${done}/${total} (${percent}%)`;
    document.getElementById("subtasks-progress-bar").style.width = `${percent}%`;

    if (subtasks.length === 0) {
        container.innerHTML = `<div class="text-xs text-muted italic p-2 bg-void/20 rounded border border-steel/20 font-sans">Nenhuma subtarefa criada ainda.</div>`;
        return;
    }

    const isSigned = cardObj.fvsSigned === true;

    subtasks.forEach(sub => {
        const item = document.createElement("div");
        item.className = "flex items-center justify-between p-2 rounded bg-dark border border-steel hover:border-fire/30 transition";
        
        const checkboxDisabledHTML = isSigned ? 'disabled' : '';

        item.innerHTML = `
            <label class="flex items-center space-x-2.5 cursor-pointer text-xs flex-1 select-none font-sans">
                <input type="checkbox" ${sub.done ? 'checked' : ''} ${checkboxDisabledHTML} onchange="toggleSubtaskStatus('${sub.id}')" class="accent-fire w-4 h-4 bg-dark2 border border-steel rounded">
                <span class="${sub.done ? 'line-through text-muted' : 'text-light'}">${sub.title}</span>
            </label>
            ${!isSigned ? `
                <button onclick="deleteSubtask('${sub.id}')" class="text-muted hover:text-red-400 transition ml-2">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            ` : ''}
        `;
        container.appendChild(item);
    });
}

async function toggleSubtaskStatus(subId) {
    const card = getActiveCard();
    if (!card || card.fvsSigned) return;

    const sub = card.subtasks.find(s => s.id === subId);
    if (sub) {
        sub.done = !sub.done;
        
        if (!card.logs) card.logs = [];
        card.logs.unshift({
            text: `Marcou subtarefa "${sub.title}" como ${sub.done ? 'Concluída' : 'Pendente'}`,
            date: getCurrentTimestamp()
        });

        saveToLocalStorage();
        renderDetailedSubtasks(card);
        renderDetailedLogs(card);
        renderFVSSignaturePanel(card);
        renderWorkflowPromotionPanel(card);
        
        if (currentActiveView === "kanban") {
            renderActiveSectorBoard();
        } else {
            renderGanttTimeline();
        }

        try {
            await syncCardRemote(card, { preferredCardId: card.id });
        } catch (error) {
            console.error("Falha ao atualizar checklist remoto:", error);
            alert(error.message || "Falha ao atualizar checklist no CRM real.");
        }
    }
}

async function addSubtask() {
    const input = document.getElementById("new-subtask-input");
    const title = input.value.trim();
    if (!title) return;

    const card = getActiveCard();
    if (!card || card.fvsSigned) return;

    if (!card.subtasks) card.subtasks = [];
    
    const newSub = {
        id: 'sub-' + Date.now(),
        title,
        done: false
    };
    card.subtasks.push(newSub);

    if (!card.logs) card.logs = [];
    card.logs.unshift({
        text: `Adicionou subtarefa: "${title}"`,
        date: getCurrentTimestamp()
    });

    saveToLocalStorage();
    input.value = "";
    renderDetailedSubtasks(card);
    renderDetailedLogs(card);
    renderFVSSignaturePanel(card);
    renderWorkflowPromotionPanel(card);
    
    if (currentActiveView === "kanban") {
        renderActiveSectorBoard();
    } else {
        renderGanttTimeline();
    }

    try {
        await syncCardRemote(card, { preferredCardId: card.id });
    } catch (error) {
        console.error("Falha ao adicionar subtarefa remota:", error);
        alert(error.message || "Falha ao salvar subtarefa no CRM real.");
    }
}

async function deleteSubtask(subId) {
    const card = getActiveCard();
    if (!card || card.fvsSigned) return;

    const subIndex = card.subtasks.findIndex(s => s.id === subId);
    if (subIndex !== -1) {
        const [deleted] = card.subtasks.splice(subIndex, 1);
        
        if (!card.logs) card.logs = [];
        card.logs.unshift({
            text: `Removeu subtarefa: "${deleted.title}"`,
            date: getCurrentTimestamp()
        });

        saveToLocalStorage();
        renderDetailedSubtasks(card);
        renderDetailedLogs(card);
        renderFVSSignaturePanel(card);
        renderWorkflowPromotionPanel(card);
        
        if (currentActiveView === "kanban") {
            renderActiveSectorBoard();
        } else {
            renderGanttTimeline();
        }

        try {
            await syncCardRemote(card, { preferredCardId: card.id });
        } catch (error) {
            console.error("Falha ao excluir subtarefa remota:", error);
            alert(error.message || "Falha ao excluir subtarefa no CRM real.");
        }
    }
}

// ==========================================
// FVS DIGITAL SIGNATURE LOGIC
// ==========================================
function renderFVSSignaturePanel(cardObj) {
    const panel = document.getElementById("fvs-signature-outer-panel");
    const subtasks = cardObj.subtasks || [];
    
    if (subtasks.length === 0 || cardObj.isWorkflowCard) {
        panel.classList.add("hidden");
        return;
    }

    panel.classList.remove("hidden");

    const isSigned = cardObj.fvsSigned === true;
    const total = subtasks.length;
    const done = subtasks.filter(s => s.done).length;
    const isCompleted = total > 0 && done === total;

    if (isSigned) {
        panel.innerHTML = `
            <div class="bg-emerald-950/20 border border-emerald-500 p-3.5 rounded-lg text-center relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <div class="absolute -right-6 -bottom-6 opacity-10 text-emerald-400 text-6xl rotate-12">
                    <i class="fa-solid fa-stamp"></i>
                </div>
                <div class="flex items-center justify-center space-x-2 text-emerald-400 font-bold font-condensed tracking-wider text-sm uppercase">
                    <i class="fa-solid fa-award text-base animate-pulse"></i>
                    <span>Procedimento FVS Homologado</span>
                </div>
                <p class="text-[10px] text-light/70 mt-1.5 leading-relaxed font-mono">
                    Assinado por: <span class="text-emerald-400 font-bold">${cardObj.fvsSignedBy}</span><br>
                    Data: <span class="text-emerald-400" id="fvs-signed-date">${cardObj.fvsSignedDate || '---'}</span><br>
                    Hash: <span class="text-muted text-[8px]" id="fvs-signed-hash">${cardObj.fvsHash || 'sha256-8f3a8b...'}</span>
                </p>
                <button onclick="unsignFVS()" class="text-[9px] text-muted hover:text-red-400 underline mt-2 block mx-auto uppercase">Desfazer Assinatura</button>
            </div>
        `;
    } else if (isCompleted) {
        panel.innerHTML = `
            <div class="bg-emerald-950/10 border border-emerald-500/30 p-3.5 rounded-lg space-y-2 text-center shadow-[0_0_12px_rgba(16,185,129,0.05)] font-sans">
                <span class="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider"><i class="fa-solid fa-award mr-1"></i>Controle de Qualidade ISO 9001</span>
                <p class="text-xs text-light/80 leading-snug">Todas as etapas do procedimento foram concluídas. Deseja homologar e assinar a FVS desta atividade?</p>
                <button onclick="signFVS()" class="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-dark font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-md">Assinar FVS Digitalmente</button>
                    </div>
                `;
            } else {
                panel.innerHTML = `
                    <div class="bg-dark p-3 rounded-lg border border-steel/60 text-center text-xs text-muted font-sans">
                        <i class="fa-solid fa-lock mr-1.5 opacity-60 font-sans"></i>Ficha de Verificação (FVS) será liberada quando 100% das etapas do checklist forem concluídas.
                    </div>
                `;
            }
        }

        function signFVS() {
            const card = getActiveCard();
            if (!card) return;

            card.fvsSigned = true;
            card.fvsSignedBy = "Ricardo Santos (Diretor)";
            card.fvsSignedDate = getCurrentTimestamp();
            card.fvsHash = 'sha256-' + Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10);

            if (!card.logs) card.logs = [];
            card.logs.unshift({
                text: "✓ Ficha de Verificação (FVS) HOMOLOGADA e Assinada Digitalmente",
                date: getCurrentTimestamp()
            });

            saveToLocalStorage();
            openViewCardModal(card.id);
            
            if (currentActiveView === "kanban") {
                renderActiveSectorBoard();
            } else {
                renderGanttTimeline();
            }
        }

        function unsignFVS() {
            if (!confirm("Atenção: Ao desfazer a assinatura, a atividade retornará para a etapa de auditoria aberta. Confirmar?")) return;

            const card = getActiveCard();
            if (!card) return;

            card.fvsSigned = false;
            card.fvsSignedBy = null;
            card.fvsSignedDate = null;
            card.fvsHash = null;

            if (!card.logs) card.logs = [];
            card.logs.unshift({
                text: "Assinatura digital desfeita por Ricardo Santos",
                date: getCurrentTimestamp()
            });

            saveToLocalStorage();
            openViewCardModal(card.id);
            
            if (currentActiveView === "kanban") {
                renderActiveSectorBoard();
            } else {
                renderGanttTimeline();
            }
        }

        // ==========================================
        // WORKFLOW PROMOTION LOGIC (SEQUENTIAL)
        // ==========================================
        function renderWorkflowPromotionPanel(cardObj) {
            const panel = document.getElementById("workflow-promotion-outer-panel");
            if (!cardObj.isWorkflowCard) {
                panel.classList.add("hidden");
                return;
            }

            panel.classList.remove("hidden");

            const currentStep = PROGRAMMED_WORKFLOW_PIPELINE[cardObj.currentStepIndex];
            const nextStep = PROGRAMMED_WORKFLOW_PIPELINE[cardObj.currentStepIndex + 1];

            const subtasks = cardObj.subtasks || [];
            const total = subtasks.length;
            const done = subtasks.filter(s => s.done).length;
            const isCompleted = total > 0 && done === total;

            if (nextStep) {
                if (isCompleted) {
                    panel.innerHTML = `
                        <div class="bg-purple-950/20 border border-purple-500 p-3.5 rounded-lg text-center space-y-2.5 shadow-[0_0_15px_rgba(168,85,247,0.15)] animate-pulse font-sans">
                            <div class="flex items-center justify-center space-x-1.5 text-purple-400 font-bold font-condensed tracking-wider text-sm uppercase">
                                <i class="fa-solid fa-circle-check text-base"></i>
                                <span>Procedimentos Concluídos!</span>
                            </div>
                            <p class="text-xs text-light/95 leading-snug">
                                Todos os procedimentos obrigatórios de <strong>${currentStep.stageName}</strong> foram cumpridos.
                            </p>
                            <button onclick="promoteCardToNextWorkflowStep()" class="w-full py-2 bg-gradient-to-r from-fire to-fire-hover hover:from-fire-hover hover:to-fire text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-md font-sans">
                                Promover para: ${nextStep.stageName} <i class="fa-solid fa-arrow-right ml-1 font-sans"></i>
                            </button>
                        </div>
                    `;
                } else {
                    panel.innerHTML = `
                        <div class="bg-dark p-3.5 border border-steel/60 rounded-lg text-center space-y-1.5 text-xs text-muted font-sans">
                            <div class="font-bold uppercase tracking-wider text-[10px] text-muted flex items-center justify-center space-x-1 font-sans font-bold">
                                <i class="fa-solid fa-lock mr-1.5 opacity-60"></i>
                                <span>Fase Sequencial Bloqueada</span>
                            </div>
                            <p class="text-[11px] leading-relaxed">
                                Complete todos os procedimentos do checklist atual para liberar a promoção automática deste projeto para a fase <strong class="text-fire uppercase font-bold">${nextStep.stageName} [${nextStep.sectorId.toUpperCase()}]</strong>.
                            </p>
                        </div>
                    `;
                }
            } else {
                if (isCompleted) {
                    panel.innerHTML = `
                        <div class="bg-emerald-950/25 border border-emerald-500/40 p-3.5 rounded-lg text-center space-y-1 font-sans">
                            <div class="text-emerald-400 font-bold font-condensed text-xs uppercase tracking-wider"><i class="fa-solid fa-circle-check mr-1"></i>PROCESSO FINALIZADO!</div>
                            <p class="text-[11px] text-light/80">Este projeto concluiu com sucesso todas as etapas sequenciais programadas do fluxo da empresa!</p>
                        </div>
                    `;
                } else {
                    panel.innerHTML = `
                        <div class="bg-dark p-3 rounded-lg border border-steel text-center text-xs text-muted font-sans">
                            <i class="fa-solid fa-flag-checkered mr-1.5 font-sans"></i>Última fase do fluxo. Conclua os procedimentos finais para encerramento de obra.
                        </div>
                    `;
                }
            }
        }

        async function promoteCardToNextWorkflowStep() {
            const card = getActiveCard();
            if (!card) return;

            const nextStepIndex = card.currentStepIndex + 1;
            if (nextStepIndex >= PROGRAMMED_WORKFLOW_PIPELINE.length) return;

            const currentStep = PROGRAMMED_WORKFLOW_PIPELINE[card.currentStepIndex];
            const nextStep = PROGRAMMED_WORKFLOW_PIPELINE[nextStepIndex];

            // Perform promotion directly on the single global source of truth!
            card.currentStepIndex = nextStepIndex;
            
            // Auto inject next procedures list
            if (nextStep && nextStep.subtasks) {
                card.subtasks = nextStep.subtasks.map((t, idx) => ({
                    id: 'sub-' + Date.now() + '-' + idx,
                    title: t,
                    done: false
                }));
            } else {
                card.subtasks = [];
            }

            if (!card.logs) card.logs = [];
            card.logs.unshift({
                text: `🚀 Card promovido para a Etapa ${nextStepIndex + 1}: "${nextStep.stageName}" no setor "${nextStep.sectorId.toUpperCase()}"`,
                date: getCurrentTimestamp()
            });

            // Automatically switch active sector view so user sees where the card landed
            activeSectorId = nextStep.sectorId;
            saveToLocalStorage();
            closeViewCardModal();
            
            renderSectorsList();
            if (currentActiveView === "kanban") {
                renderActiveSectorBoard();
            } else {
                renderGanttTimeline();
            }

            try {
                await syncCardRemote(card, { preferredCardId: card.id });
                alert(`Sucesso! O card foi promovido para o setor "${activeSectorId.toUpperCase()}" na etapa "${nextStep.stageName}".`);
            } catch (error) {
                console.error("Falha ao promover card remoto:", error);
                alert(error.message || "Falha ao promover card no CRM real.");
            }
        }

        // ==========================================
        // COLLABORATION COMMENTS FEED & LOGS & ATTACHMENTS
        // ==========================================
        function renderDetailedComments(cardObj) {
            const comments = cardObj.comments || [];
            const container = document.getElementById("comments-feed-container");
            container.innerHTML = "";

            if (comments.length === 0) {
                container.innerHTML = `<div class="text-xs text-muted italic p-2 bg-void/20 rounded border border-steel/20 font-sans">Nenhum comentário registrado no diário.</div>`;
                return;
            }

            comments.forEach(com => {
                const item = document.createElement("div");
                item.className = "bg-dark p-3 rounded-lg border border-steel space-y-1.5";
                const initial = com.author.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
                
                item.innerHTML = `
                    <div class="flex items-center justify-between text-[11px] font-sans">
                        <div class="flex items-center space-x-1.5 font-bold text-light">
                            <span class="w-4 h-4 rounded-full bg-steel text-fire flex items-center justify-center text-[8px] font-black">${initial}</span>
                            <span>${com.author}</span>
                        </div>
                        <span class="text-muted font-mono text-[9px]">${com.date}</span>
                    </div>
                    <p class="text-xs text-light/80 leading-normal pl-5 break-words font-sans">${com.text}</p>
                `;
                container.appendChild(item);
            });
        }

        async function addComment() {
            const textarea = document.getElementById("new-comment-textarea");
            const text = textarea.value.trim();
            if (!text) return;

            const card = getActiveCard();
            if (!card) return;

            if (!card.comments) card.comments = [];

            const newComment = {
                author: "Ricardo Santos",
                text,
                date: getCurrentTimestamp()
            };
            card.comments.push(newComment);

            if (!card.logs) card.logs = [];
            card.logs.unshift({
                text: "Adicionou anotação no diário da atividade",
                date: getCurrentTimestamp()
            });

            saveToLocalStorage();
            textarea.value = "";
            renderDetailedComments(card);
            renderDetailedLogs(card);
            
            if (currentActiveView === "kanban") {
                renderActiveSectorBoard();
            } else {
                renderGanttTimeline();
            }

            try {
                await apiRequest(`${CRM_DEALS_ENDPOINT}/${card.id}/activities`, {
                    method: "POST",
                    body: JSON.stringify({
                        type: "note",
                        subject: `Comentario · ${card.title}`,
                        body: text,
                        channel: "manual",
                        done: true
                    })
                });
                await loadRemoteState(card.id);
                openViewCardModal(card.id);
            } catch (error) {
                console.error("Falha ao salvar comentario remoto:", error);
                alert(error.message || "Falha ao salvar comentario no CRM real.");
            }
        }

        function renderDetailedLogs(cardObj) {
            const logs = cardObj.logs || [];
            const container = document.getElementById("audit-logs-container");
            container.innerHTML = "";

            if (logs.length === 0) {
                container.innerHTML = `<div class="italic text-muted font-sans text-xs">Sem logs registrados.</div>`;
                return;
            }

            logs.forEach(log => {
                const logEl = document.createElement("div");
                logEl.className = "flex items-start space-x-1 border-b border-steel/30 pb-1 font-mono";
                logEl.innerHTML = `
                    <span class="text-fire select-none">&gt;</span>
                    <div class="flex-1">
                        <span class="text-light">${log.text}</span>
                        <span class="block text-[8px] text-muted font-mono mt-0.5">${log.date}</span>
                    </div>
                `;
                container.appendChild(logEl);
            });
        }

        function renderDetailedAttachments(cardObj) {
            const attachments = cardObj.attachments || [];
            const container = document.getElementById("attachments-container");
            container.innerHTML = "";

            if (attachments.length === 0) {
                container.innerHTML = `<div class="col-span-3 text-center py-4 border border-dashed border-steel rounded text-xs text-muted bg-void/10 font-sans">Nenhum anexo. Clique em 'Anexar Foto' para subir um registro do canteiro.</div>`;
                return;
            }

            attachments.forEach((att, idx) => {
                const attCard = document.createElement("div");
                attCard.className = "bg-dark border border-steel rounded-lg overflow-hidden group/att relative cursor-pointer font-sans";
                attCard.innerHTML = `
                    <img src="${att.url}" alt="${att.name}" class="w-full h-14 object-cover">
                    <div class="p-1.5 flex items-center justify-between text-[10px]">
                        <span class="truncate text-light font-mono" title="${att.name}">${att.name}</span>
                        <button onclick="deleteAttachment(${idx})" class="text-muted hover:text-red-400 no-modal-trigger font-sans">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;
                container.appendChild(attCard);
            });
        }

        function simulateAddAttachment() {
            alert("Anexos ainda nao estao integrados ao backend deste CRM focado.");
        }

        function deleteAttachment(idx) {
            event.stopPropagation();
            const card = getActiveCard();
            if (!card) return;

            const [deleted] = card.attachments.splice(idx, 1);
            
            if (!card.logs) card.logs = [];
            card.logs.unshift({
                text: `Removeu anexo: "${deleted.name}"`,
                date: getCurrentTimestamp()
            });

            saveToLocalStorage();
            renderDetailedAttachments(card);
            renderDetailedLogs(card);
            
            if (currentActiveView === "kanban") {
                renderActiveSectorBoard();
            } else {
                renderGanttTimeline();
            }
        }

        // ==========================================
        // SEARCH AND FILTER INTERACTION
        // ==========================================
        function filterCards() {
            const searchValue = document.getElementById("search-input").value.toLowerCase().trim();
            const priorityValue = document.getElementById("priority-filter").value;
            
            if (currentActiveView === "kanban") {
                const activeSector = sectors.find(s => s.id === activeSectorId);
                if (!activeSector) return;

                const columnsList = PROGRAMMED_WORKFLOW_PIPELINE.filter(step => step.sectorId === activeSectorId);

                columnsList.forEach(col => {
                    const listEl = document.getElementById(`col-list-step-${col.step}`);
                    if (!listEl) return;

                    const cardElements = listEl.querySelectorAll('[draggable="true"]');
                    let visibleCount = 0;

                    cardElements.forEach(cardEl => {
                        const cardId = cardEl.getAttribute("id");
                        const cardObj = allCards.find(c => c.id === cardId);

                        if (!cardObj) return;

                        const matchesSearch = cardObj.title.toLowerCase().includes(searchValue) || 
                                              cardObj.desc.toLowerCase().includes(searchValue) ||
                                              (cardObj.responsible && cardObj.responsible.toLowerCase().includes(searchValue));

                        const matchesPriority = priorityValue === "all" || cardObj.priority === priorityValue;

                        if (matchesSearch && matchesPriority) {
                            cardEl.classList.remove("hidden");
                            visibleCount++;
                        } else {
                            cardEl.classList.add("hidden");
                        }
                    });

                    const countBadge = document.getElementById(`count-step-${col.step}`);
                    if (countBadge) {
                        countBadge.textContent = visibleCount;
                    }
                });
            } else {
                renderGanttTimeline();
                const rows = document.querySelectorAll("#gantt-rows-container > div");
                rows.forEach(row => {
                    const rowPriority = row.getAttribute("data-priority") || "Média";
                    const titleText = row.querySelector(".font-bold").textContent.toLowerCase();
                    const respText = row.querySelector(".truncate").textContent.toLowerCase();
                    
                    const matchesSearch = titleText.includes(searchValue) || respText.includes(searchValue);
                    const matchesPriority = priorityValue === "all" || rowPriority === priorityValue;
                    
                    if (matchesSearch && matchesPriority) {
                        row.classList.remove("hidden");
                        row.classList.add("grid");
                    } else {
                        row.classList.add("hidden");
                        row.classList.remove("grid");
                    }
                });
            }
        }

        // ==========================================
        // SYSTEM TIMESTAMPS
        // ==========================================
        function getCurrentTimestamp() {
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const d = pad(now.getDate());
            const m = pad(now.getMonth() + 1);
            const y = now.getFullYear();
            const h = pad(now.getHours());
            const min = pad(now.getMinutes());
            return `${d}/${m}/${y} ${h}:${min}`;
        }

        // DYNAMIC SVG DEPENDENCY ARROW DRAWING (MS PROJECT-STYLE)
        function drawGanttDependencyLines() {
            const rowsContainer = document.getElementById("gantt-rows-container");
            if (!rowsContainer || currentActiveView !== "gantt") return;

            // Check if SVG overlay already exists, else create it
            let svg = document.getElementById("gantt-svg-overlay");
            if (!svg) {
                svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svg.setAttribute("id", "gantt-svg-overlay");
                svg.setAttribute("class", "absolute inset-0 pointer-events-none z-20 w-full h-full");
                rowsContainer.style.position = "relative";
                rowsContainer.appendChild(svg);
            } else {
                svg.innerHTML = "";
            }

            // Define beautiful arrowheads inside SVG
            svg.innerHTML = `
                <defs>
                    <marker id="gantt-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#FF6B1A"/>
                    </marker>
                </defs>
            `;

            const containerRect = rowsContainer.getBoundingClientRect();

            // Iterate through programmed pipeline steps and connect consecutive task bars!
            for (let idx = 0; idx < PROGRAMMED_WORKFLOW_PIPELINE.length - 1; idx++) {
                const step = PROGRAMMED_WORKFLOW_PIPELINE[idx];
                const nextStep = PROGRAMMED_WORKFLOW_PIPELINE[idx + 1];

                const barCur = document.getElementById(`gantt-bar-step-${step.step}`);
                const barNext = document.getElementById(`gantt-bar-step-${nextStep.step}`);

                if (barCur && barNext) {
                    const rectCur = barCur.getBoundingClientRect();
                    const rectNext = barNext.getBoundingClientRect();

                    // Coordinate calculations relative to the absolute overlay container!
                    const x1 = rectCur.right - containerRect.left;
                    const y1 = (rectCur.top + rectCur.bottom) / 2 - containerRect.top;

                    const x2 = rectNext.left - containerRect.left;
                    const y2 = (rectNext.top + rectNext.bottom) / 2 - containerRect.top;

                    // Horizontal gap buffer shoulder
                    const shoulderX = x1 + 10;

                    // Draw perfect orthogonal S-curve path connecting Bar N and Bar N+1
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
        }

        // Redraw dependency lines on window resize to ensure flawless alignment
        window.addEventListener("resize", () => {
            if (currentActiveView === "gantt") {
                drawGanttDependencyLines();
            }
        });

        // Robust DOM ready checker to prevent file:/// load racing conditions
        if (document.readyState === "loading") {
            window.addEventListener("DOMContentLoaded", initApp);
        } else {
            initApp();
        }
