interface Window {
  turnstile: {
    render: (element: string | HTMLElement) => void;
    reset: (element: string | HTMLElement) => void;
    getResponse: (element: string | HTMLElement) => string | null;
    remove: (element: string | HTMLElement) => void;
  };
}
