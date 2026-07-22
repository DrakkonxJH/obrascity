"use client";

interface PasswordStrengthProps {
  password: string;
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score: 1, label: "Fraca", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "Regular", color: "bg-amber-500" };
  if (score <= 3) return { score: 3, label: "Boa", color: "bg-yellow-500" };
  if (score <= 4) return { score: 4, label: "Forte", color: "bg-emerald-500" };
  return { score: 5, label: "Excelente", color: "bg-emerald-400" };
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const { score, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-bone/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                i <= score ? color : "bg-transparent"
              }`}
              style={{ transform: `scaleX(${i <= score ? 1 : 0})`, transformOrigin: "left" }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.2em] uppercase text-bone-dim/60">
          {label}
        </span>
        <span className="text-[10px] text-bone-dim/40">
          {score >= 3 ? "✓" : ""} {password.length >= 8 ? "8+ chars" : `${password.length}/8`}
        </span>
      </div>
    </div>
  );
}
