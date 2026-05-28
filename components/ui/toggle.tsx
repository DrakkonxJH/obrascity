"use client";

type ToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
};

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`of-toggle ${checked ? "on" : "off"}`}
      aria-pressed={checked}
    />
  );
}
