"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogOut } from "lucide-react";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import {
  Screen01A,
  Screen01B,
  Screen01C,
  Screen02BLiveness,
  Screen02Upload,
  Screen02VerifyProcessing,
} from "@/components/DokimosFlow";

/** Linear onboarding: intro (0–2) → ID upload (3) → liveness (4) → TEE verify (5). Then `/app/vault`. */
export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const forceIntro = searchParams.get("intro") === "1";
  const { status } = useSession();
  const {
    setAttestationData,
    setStoredImageData,
    markOnboardingComplete,
  } = useDokimosApp();

  const [step, setStep] = useState(0);

  const prevStatusRef = useRef<typeof status | undefined>(undefined);
  const initialSessionResolvedRef = useRef(false);

  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;

    if (status === "loading") return;

    if (!initialSessionResolvedRef.current) {
      initialSessionResolvedRef.current = true;
      if (status === "authenticated" && !forceIntro) {
        setStep((s) => (s < 3 ? 3 : s));
      }
      return;
    }

    if (status === "authenticated" && prev === "unauthenticated" && !forceIntro) {
      setStep((s) => (s < 3 ? 3 : s));
    }
  }, [status, forceIntro]);

  const advanceStep = useCallback(() => {
    setStep((s) => (s < 5 ? s + 1 : s));
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => (s > 0 ? s - 1 : s));
  }, []);

  useEffect(() => {
    if (step !== 0 && step !== 1) return;
    const t = setTimeout(() => advanceStep(), 3500);
    return () => clearTimeout(t);
  }, [step, advanceStep]);

  const finishVerification = useCallback(() => {
    markOnboardingComplete();
    router.push("/app/vault");
  }, [markOnboardingComplete, router]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    setStep(0);
  };

  let content: React.ReactNode;
  switch (step) {
    case 0:
      content = <Screen01A key="01a" />;
      break;
    case 1:
      content = <Screen01B key="01b" />;
      break;
    case 2:
      content = <Screen01C key="01c" onNext={advanceStep} />;
      break;
    case 3:
      content = (
        <Screen02Upload
          key="02"
          onNext={advanceStep}
          onBack={goBack}
          setStoredImageData={(d) => setStoredImageData(d)}
        />
      );
      break;
    case 4:
      content = (
        <Screen02BLiveness key="02b" onNext={advanceStep} onBack={goBack} />
      );
      break;
    case 5:
      content = (
        <Screen02VerifyProcessing
          key="02c"
          onBack={goBack}
          onSuccess={finishVerification}
          setAttestationData={(d) => setAttestationData(d)}
        />
      );
      break;
    default:
      content = null;
  }

  return (
    <>
      <div className="relative min-h-[100dvh] w-full overflow-y-auto bg-gray-100">{content}</div>

      {process.env.NODE_ENV === "development" && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[100] max-w-[calc(100vw-2rem)]">
          <div className="pointer-events-auto flex flex-col gap-2 rounded-xl border border-gray-200 bg-white/95 p-3 text-xs shadow-lg backdrop-blur">
            <div className="text-center font-medium text-gray-600">
              Onboarding {step + 1} / 6
            </div>
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="rounded-lg bg-gray-100 px-3 py-2 text-gray-800 disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (step < 5) advanceStep();
                else finishVerification();
              }}
              className="rounded-lg bg-indigo-500 px-3 py-2 text-white"
            >
              {step < 5 ? "Next →" : "Finish → app"}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-white hover:bg-red-600"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
