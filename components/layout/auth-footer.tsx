export function AuthFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--of-border)] bg-[var(--of-surface)] mt-auto">
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <p className="text-center text-sm text-[var(--of-text-secondary)]">
          &copy; {currentYear} ObrasFlow. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
