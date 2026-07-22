/* Shared reference to the Lenis instance so any component can smooth-scroll. */
export interface LenisLike {
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number }
  ) => void;
  stop: () => void;
  start: () => void;
}

export const scrollStore: { lenis: LenisLike | null } = { lenis: null };
