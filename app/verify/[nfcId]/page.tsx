"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StepIndicator from "@/components/StepIndicator";
import SealStamp from "@/components/SealStamp";
import ImageUploadStep from "@/components/ImageUploadStep";
import QrScanner from "@/components/QrScanner";

type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  referenceImageUrl: string;
};

type Stage = "loading" | "image" | "qr" | "done" | "invalid";
type Result = "authentic" | "suspicious" | "not_authentic";

export default function VerifyPage() {
  const params = useParams<{ nfcId: string }>();
  const [stage, setStage] = useState<Stage>("loading");
  const [scanId, setScanId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [imageMatched, setImageMatched] = useState<boolean | null>(null);
  const [qrMatched, setQrMatched] = useState<boolean | null>(null);
  const [finalResult, setFinalResult] = useState<Result | null>(null);
  const [submittingImage, setSubmittingImage] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/verify/${encodeURIComponent(params.nfcId)}`);
      const data = await res.json();
      if (!data.valid) {
        setStage("invalid");
        return;
      }
      setScanId(data.scanId);
      setProduct(data.product);
      setStage("image");
    }
    load();
  }, [params.nfcId]);

  async function submitImage(file: File) {
    if (!scanId) return;
    setSubmittingImage(true);
    const form = new FormData();
    form.append("scanId", scanId);
    form.append("image", file);
    const res = await fetch("/api/verify/image", { method: "POST", body: form });
    const data = await res.json();
    setSubmittingImage(false);
    if (res.ok) {
      setImageMatched(data.matched);
      setStage("qr");
    }
  }

  async function submitQr(value: string) {
    if (!scanId) return;
    setQrError(null);
    const res = await fetch("/api/verify/qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId, qrValue: value }),
    });
    const data = await res.json();
    if (!res.ok) {
      setQrError("Something went wrong reading that code. Try again.");
      return;
    }
    setQrMatched(data.matched);

    // NFC already matched (that's how we got here). Combine all three
    // signals client-side for immediate display; the server has already
    // recorded the authoritative result for the image step, and we finalize
    // it here by also factoring in the QR outcome.
    const authentic = data.matched && imageMatched;
    setFinalResult(authentic ? "authentic" : "suspicious");
    setStage("done");
  }

  const steps = [
    { label: "Photo", status: stepStatus(stage, "image") },
    { label: "QR code", status: stepStatus(stage, "qr") },
    { label: "NFC tag", status: "done" as const },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-12">
      <p className="label-eyebrow mb-2">Product verification</p>
      {product && (
        <h1 className="mb-8 text-center font-display text-2xl">{product.name}</h1>
      )}

      {stage === "invalid" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <SealStamp state="not_authentic" />
          <p className="max-w-xs text-center text-sm text-foil">
            We couldn&apos;t find a product matching this tag or code. If you believe
            this is a genuine item, please contact the seller.
          </p>
        </div>
      ) : (
        <>
          <StepIndicator steps={steps} />

          {stage === "loading" && <p className="text-sm text-foil">Reading tag...</p>}

          {stage === "image" && product && (
            <ImageUploadStep
              referenceImageUrl={product.referenceImageUrl}
              onSubmit={submitImage}
              submitting={submittingImage}
            />
          )}

          {stage === "qr" && (
            <div className="flex flex-col items-center gap-3">
              <QrScanner onResult={submitQr} />
              {qrError && <p className="text-sm text-alert">{qrError}</p>}
            </div>
          )}

          {stage === "done" && finalResult && (
            <div className="flex flex-col items-center gap-6">
              <SealStamp state={finalResult} />
              <dl className="w-full max-w-xs space-y-2 font-mono text-xs text-foil">
                <div className="flex justify-between">
                  <dt>NFC tag</dt>
                  <dd className="text-verify">matched</dd>
                </div>
                <div className="flex justify-between">
                  <dt>QR code</dt>
                  <dd className={qrMatched ? "text-verify" : "text-alert"}>
                    {qrMatched ? "matched" : "no match"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Photo</dt>
                  <dd className={imageMatched ? "text-verify" : "text-alert"}>
                    {imageMatched ? "matched" : "no match"}
                  </dd>
                </div>
              </dl>
              {finalResult === "suspicious" && (
                <p className="max-w-xs text-center text-sm text-foil">
                  Your tag is genuine, but the photo or QR code didn&apos;t match our
                  records. This can happen with packaging changes -- if you have
                  concerns, contact the seller with your product&apos;s SKU:{" "}
                  <span className="font-mono">{product?.sku}</span>.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function stepStatus(
  stage: Stage,
  step: "image" | "qr"
): "done" | "active" | "upcoming" {
  const order: Stage[] = ["image", "qr", "done"];
  const stageIndex = order.indexOf(stage);
  const stepIndex = order.indexOf(step);
  if (stage === "done") return "done";
  if (stepIndex < stageIndex) return "done";
  if (stepIndex === stageIndex) return "active";
  return "upcoming";
}
