"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Obra } from "@/types/domain";

export type DetailPayload = {
  title: string;
  rows: Array<{ label: string; value: string }>;
  obra?: Obra;
};

type AppUiContextValue = {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  notifOpen: boolean;
  novaObraOpen: boolean;
  addMemberOpen: boolean;
  trashEnabled: boolean;
  detail: DetailPayload | null;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleNotif: () => void;
  closeNotif: () => void;
  openNovaObra: () => void;
  closeNovaObra: () => void;
  openAddMember: () => void;
  closeAddMember: () => void;
  openDetail: (payload: DetailPayload) => void;
  closeDetail: () => void;
};

const AppUiContext = createContext<AppUiContextValue | null>(null);

export function AppUiProvider({ children, trashEnabled }: { children: ReactNode; trashEnabled: boolean }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [novaObraOpen, setNovaObraOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [detail, setDetail] = useState<DetailPayload | null>(null);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);
  const toggleMobileSidebar = useCallback(() => setMobileSidebarOpen((v) => !v), []);
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const toggleNotif = useCallback(() => setNotifOpen((v) => !v), []);
  const closeNotif = useCallback(() => setNotifOpen(false), []);
  const openNovaObra = useCallback(() => setNovaObraOpen(true), []);
  const closeNovaObra = useCallback(() => setNovaObraOpen(false), []);
  const openAddMember = useCallback(() => setAddMemberOpen(true), []);
  const closeAddMember = useCallback(() => setAddMemberOpen(false), []);
  const openDetail = useCallback((payload: DetailPayload) => setDetail(payload), []);
  const closeDetail = useCallback(() => setDetail(null), []);

  const value = useMemo(
    () => ({
      sidebarCollapsed,
      mobileSidebarOpen,
      notifOpen,
      novaObraOpen,
      addMemberOpen,
      trashEnabled,
      detail,
      toggleSidebar,
      toggleMobileSidebar,
      closeMobileSidebar,
      toggleNotif,
      closeNotif,
      openNovaObra,
      closeNovaObra,
      openAddMember,
      closeAddMember,
      openDetail,
      closeDetail,
    }),
    [
      sidebarCollapsed,
      mobileSidebarOpen,
      notifOpen,
      novaObraOpen,
      addMemberOpen,
      trashEnabled,
      detail,
      toggleSidebar,
      toggleMobileSidebar,
      closeMobileSidebar,
      toggleNotif,
      closeNotif,
      openNovaObra,
      closeNovaObra,
      openAddMember,
      closeAddMember,
      openDetail,
      closeDetail,
    ],
  );

  return <AppUiContext.Provider value={value}>{children}</AppUiContext.Provider>;
}

export function useAppUi() {
  const ctx = useContext(AppUiContext);
  if (!ctx) {
    throw new Error("useAppUi must be used within AppUiProvider");
  }
  return ctx;
}
