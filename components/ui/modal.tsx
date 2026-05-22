type ModalProps = {
  title: string;
  children: React.ReactNode;
};

export function Modal({ title, children }: ModalProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {children}
    </div>
  );
}
