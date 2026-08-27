"use client";

type Step = { label: string; status: "done" | "active" | "upcoming" | "skipped" };

export default function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <ol className="mb-10 flex w-full max-w-sm items-center justify-between">
      {steps.map((step, i) => (
        <li key={step.label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border font-mono text-xs transition-colors ${
                step.status === "done"
                  ? "border-verify bg-verify text-paper"
                  : step.status === "active"
                  ? "border-ink text-ink"
                  : "border-line text-foil"
              }`}
            >
              {step.status === "done" ? "✓" : i + 1}
            </div>
            <span
              className={`label-eyebrow whitespace-nowrap ${
                step.status === "upcoming" ? "opacity-50" : ""
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`mx-2 mb-5 h-px flex-1 ${
                step.status === "done" ? "bg-verify" : "bg-line"
              }`}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
