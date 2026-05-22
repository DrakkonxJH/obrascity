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
      className={`inline-flex h-6 w-11 items-center rounded-full p-1 ${
        checked ? "bg-blue-600" : "bg-zinc-300"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
