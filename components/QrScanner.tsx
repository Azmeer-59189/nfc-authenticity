"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Props = {
  onResult: (value: string) => void;
};

export default function QrScanner({ onResult }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number>();
  const [error, setError] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [useManual, setUseManual] = useState(false);

  useEffect(() => {
    if (useManual) return;

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        setError("Camera unavailable. You can type the code from the QR label instead.");
        setUseManual(true);
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            onResult(code.data);
            return;
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useManual]);

  if (useManual) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-3">
        {error && <p className="text-sm text-alert">{error}</p>}
        <input
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder="Code printed under the QR label"
          className="w-full rounded-full border border-line bg-white px-5 py-3 font-mono text-sm outline-none focus:border-gold"
        />
        <button
          onClick={() => manualValue.trim() && onResult(manualValue.trim())}
          className="rounded-full bg-ink px-6 py-3 text-sm text-paper transition-opacity hover:opacity-85"
        >
          Submit code
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-line bg-panel">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-gold/70" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <p className="label-eyebrow">Point your camera at the QR code</p>
      <button
        onClick={() => setUseManual(true)}
        className="text-xs text-foil underline underline-offset-2"
      >
        Type the code instead
      </button>
    </div>
  );
}
