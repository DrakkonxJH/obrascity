type BadgeProps = {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
};

export function Badge({ label, variant = "default" }: BadgeProps) {
  return (
    <span className={`of-badge of-badge-${variant}`}>
      {label}
    </span>
  );
}
