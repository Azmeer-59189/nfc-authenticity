"use client";

type Props = {
  state: "pending" | "authentic" | "suspicious" | "not_authentic";
};

const COPY: Record<Props["state"], { label: string; sub: string }> = {
  pending: { label: "verifying", sub: "" },
  authentic: { label: "genuine", sub: "All checks passed" },
  suspicious: { label: "review", sub: "Tag matched, but something's off" },
  not_authentic: { label: "not verified", sub: "This code isn't in our records" },
};

const RING: Record<Props["state"], string> = {
  pending: "border-foil/50",
  authentic: "border-gold shadow-seal",
  suspicious: "border-gold/70",
  not_authentic: "border-alert",
};

const TEXT: Record<Props["state"], string> = {
  pending: "text-foil",
  authentic: "text-gold",
  suspicious: "text-gold",
  not_authentic: "text-alert",
};

export default function SealStamp({ state }: Props) {
  const copy = COPY[state];
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex h-32 w-32 items-center justify-center rounded-full border transition-all duration-500 ${RING[state]} ${
          state === "pending" ? "animate-pulse" : ""
        }`}
      >
        <div
          className={`absolute inset-2 rounded-full border border-dashed ${
            state === "not_authentic" ? "border-alert/40" : "border-gold/40"
          }`}
        />
        <span className={`font-display italic text-base ${TEXT[state]}`}>{copy.label}</span>
      </div>
      {copy.sub && <p className="mt-4 text-sm text-foil">{copy.sub}</p>}
    </div>
  );
}
