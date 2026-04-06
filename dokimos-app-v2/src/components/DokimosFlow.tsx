"use client";

import { motion } from "framer-motion";
import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
  type ChangeEvent,
} from "react";
import {
  Shield,
  ArrowLeft,
  ImagePlus,
  Check,
  ExternalLink,
  Copy,
  XCircle,
  Activity,
  Settings,
  Clock,
} from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  DokimosHubActionRow,
  DokimosPageChrome,
  DokimosSurfaceCard,
  type HubAction,
} from "@/components/dokimos/DokimosPageChrome";
import { useHowItWorksModal } from "@/contexts/HowItWorksModalContext";
import { VaultInfoMenu } from "@/components/dokimos/VaultInfoMenu";
import { VaultCredentialRowList } from "@/components/dokimos/VaultVerifiedAttributeList";
import { VaultNavigationDashboard } from "@/components/dokimos/VaultHomepage";
import { PlaidSplitOnboardingLayout } from "@/components/dokimos/onboarding/PlaidSplitOnboardingLayout";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import {
  VAULT_DEMO_ATTRIBUTES,
  formatVaultAttributeDisplay,
  groupVaultAttributes,
  sortIdentityEntries,
} from "@/lib/vaultAttributes";
import { workflowDisplayName } from "@/lib/workflowDisplayName";
import {
  formatVerificationAttributeKey,
  getCompanyBadgeColor,
  getDisplayedAttributeKeys,
} from "@/lib/verificationRequestDisplay";
import { useDokimosApp } from "@/contexts/DokimosAppContext";
import {
  STORAGE_HAS_ENCRYPTED_ID,
  STORAGE_LIVE_PHOTO,
  type AttestationData,
  type VerificationRequest,
  type DokimosAppTab,
} from "@/types/dokimos";

/** Shared shell: full-viewport canvas, optional sub-header, scrollable main, bottom tabs */
function DokimosAppShell({
  children,
  activeTab,
  onTabChange,
  showTabBar = true,
  topBar,
}: {
  children: React.ReactNode;
  activeTab: DokimosAppTab;
  onTabChange: (tab: DokimosAppTab) => void;
  showTabBar?: boolean;
  topBar?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-[#FAFAF9] pt-[env(safe-area-inset-top)]">
      {topBar}
      <div className="mx-auto flex min-h-0 w-full max-w-[600px] flex-1 flex-col overflow-hidden lg:max-w-3xl">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">{children}</div>
      </div>
      {showTabBar && (
        <nav className="w-full shrink-0 border-t border-gray-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-md">
          <div className="mx-auto flex max-w-[600px] items-end justify-around px-2 lg:max-w-3xl">
              <button
                type="button"
                onClick={() => onTabChange("vault")}
                className={`flex min-w-[72px] flex-col items-center gap-1 rounded-lg px-3 py-1 transition-colors ${
                  activeTab === "vault"
                    ? "text-dokimos-accent"
                    : "text-[#6B7280] hover:text-gray-900"
                }`}
                style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
              >
                <span
                  className={`mb-0.5 block h-1 w-1 rounded-full ${activeTab === "vault" ? "bg-dokimos-accent" : "bg-transparent"}`}
                  aria-hidden
                />
                <Shield size={20} strokeWidth={activeTab === "vault" ? 2.5 : 2} />
                <span className="text-[11px] font-normal">Vault</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange("activity")}
                className={`flex min-w-[72px] flex-col items-center gap-1 rounded-lg px-3 py-1 transition-colors ${
                  activeTab === "activity"
                    ? "text-dokimos-accent"
                    : "text-[#6B7280] hover:text-gray-900"
                }`}
                style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
              >
                <span
                  className={`mb-0.5 block h-1 w-1 rounded-full ${activeTab === "activity" ? "bg-dokimos-accent" : "bg-transparent"}`}
                  aria-hidden
                />
                <Activity size={20} strokeWidth={activeTab === "activity" ? 2.5 : 2} />
                <span className="text-[11px] font-normal">Activity</span>
              </button>
              <button
                type="button"
                onClick={() => onTabChange("settings")}
                className={`flex min-w-[72px] flex-col items-center gap-1 rounded-lg px-3 py-1 transition-colors ${
                  activeTab === "settings"
                    ? "text-dokimos-accent"
                    : "text-[#6B7280] hover:text-gray-900"
                }`}
                style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
              >
                <span
                  className={`mb-0.5 block h-1 w-1 rounded-full ${activeTab === "settings" ? "bg-dokimos-accent" : "bg-transparent"}`}
                  aria-hidden
                />
                <Settings size={20} strokeWidth={activeTab === "settings" ? 2.5 : 2} />
                <span className="text-[11px] font-normal">Settings</span>
              </button>
            </div>
        </nav>
      )}
    </div>
  );
}

/** Onboarding steps: full-height scroll, centered column (matches app shell max width). */
function AppFlowScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-[#FAFAF9] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[600px] flex-col px-4 sm:px-6 md:px-8 lg:max-w-3xl">
        {children}
      </div>
    </div>
  );
}

export function ShareRequestTopBar({ onBack }: { onBack: () => void }) {
  return (
    <div className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-gray-200/80 bg-[#FAFAF9]/95 px-4 py-3 backdrop-blur-md sm:px-5">
      <button
        type="button"
        onClick={onBack}
        className="-ml-1 rounded-lg p-1 hover:bg-gray-200/60 transition-colors"
        aria-label="Back"
      >
        <ArrowLeft size={22} className="text-gray-900" />
      </button>
      <span
        className="text-[17px] font-semibold text-gray-900"
        style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
      >
        Review request
      </span>
    </div>
  );
}

export { Screen02UploadOrCapture } from "@/components/dokimos/Screen02UploadOrCapture";

// Screen 02B — Selfie capture (TEE performs face match from livePhotoBase64)
export function Screen02BLiveness({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  /** Increments only in effect cleanup. In-flight getUserMedia from a previous mount compares against this so Strict Mode / double-mount does not set error or drop the winning stream incorrectly. */
  const cameraSessionRef = useRef(0);
  const [cameraStatus, setCameraStatus] = useState<"starting" | "preview" | "error" | "processing">("starting");

  /** Stop all tracks and detach the video element — otherwise many browsers keep the camera LED on. */
  const releaseCamera = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
      try {
        video.load();
      } catch {
        /* ignore */
      }
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const sessionAtMount = cameraSessionRef.current;

    const startCamera = async () => {
      const logCtx = { sessionAtMount, sessionNow: () => cameraSessionRef.current };
      if (!navigator.mediaDevices?.getUserMedia) {
        console.error("[Dokimos selfie] getUserMedia not available", logCtx);
        queueMicrotask(() => {
          if (sessionAtMount !== cameraSessionRef.current) return;
          setCameraStatus("error");
        });
        return;
      }

      console.log("[Dokimos selfie] getUserMedia requested", logCtx);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });
        console.log("[Dokimos selfie] getUserMedia success", {
          ...logCtx,
          trackCount: mediaStream.getTracks().length,
          trackLabels: mediaStream.getVideoTracks().map((t) => t.label),
        });

        if (cancelled || sessionAtMount !== cameraSessionRef.current) {
          console.log("[Dokimos selfie] discarding stream (stale session)", {
            sessionAtMount,
            current: cameraSessionRef.current,
            cancelled,
          });
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = mediaStream;
        setCameraStatus("preview");
        console.log("[Dokimos selfie] cameraStatus -> preview", {
          videoRefExists: Boolean(videoRef.current),
        });
      } catch (err) {
        const e = err as DOMException & { name?: string };
        console.error("[Dokimos selfie] getUserMedia error", {
          ...logCtx,
          name: e?.name,
          message: e?.message,
          err,
        });
        const failedSession = sessionAtMount;
        queueMicrotask(() => {
          if (cancelled) {
            console.log("[Dokimos selfie] ignoring error (effect cancelled)");
            return;
          }
          if (failedSession !== cameraSessionRef.current) {
            console.log("[Dokimos selfie] ignoring error (stale session after Strict Mode cleanup)", {
              failedSession,
              current: cameraSessionRef.current,
            });
            return;
          }
          if (streamRef.current) {
            console.log("[Dokimos selfie] ignoring error (stream already active)");
            return;
          }
          console.warn("[Dokimos selfie] cameraStatus -> error");
          setCameraStatus("error");
        });
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      cameraSessionRef.current += 1;
      console.log("[Dokimos selfie] cleanup: stop tracks, bump session", {
        newSession: cameraSessionRef.current,
      });
      releaseCamera();
    };
  }, [releaseCamera]);

  useLayoutEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || cameraStatus !== "preview") {
      console.log("[Dokimos selfie] skip video bind", {
        cameraStatus,
        hasVideo: Boolean(video),
        hasStream: Boolean(stream),
      });
      return;
    }
    video.srcObject = stream;
    void video.play().then(
      () =>
        console.log("[Dokimos selfie] video.play() ok", {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
        }),
      (playErr) =>
        console.error("[Dokimos selfie] video.play() failed", playErr)
    );
  }, [cameraStatus]);

  useEffect(() => {
    if (cameraStatus === "error") {
      console.warn("[Dokimos selfie] UI shows Camera access denied", {
        session: cameraSessionRef.current,
        hasStreamRef: Boolean(streamRef.current),
      });
    }
  }, [cameraStatus]);

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream || cameraStatus !== "preview") return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const c = canvasRef.current ?? document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    const ctx = c.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.92);
    try {
      localStorage.setItem(STORAGE_LIVE_PHOTO, dataUrl);
    } catch {
      /* ignore */
    }
    releaseCamera();
    setCameraStatus("processing");
    setTimeout(() => {
      onNext();
    }, 500);
  };

  return (
    <PlaidSplitOnboardingLayout
      onBack={onBack}
      leftHeadline="Just making sure it's you."
      leftBullets={[
        "Face match runs against your ID photo in protected hardware",
        "No image is stored after verification completes",
        "Same privacy guarantees as your government ID upload",
      ]}
      cardTitle="Take a photo"
      cardDescription="Take a quick selfie to confirm you're the person on this ID."
      cardDetail="Your photo is processed in protected hardware and immediately deleted. Not even Dokimos can see it."
      error={
        cameraStatus === "error" ? (
          <p className="text-left text-[13px] text-red-600" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
            Camera access denied. Enable camera permissions in your browser and try again.
          </p>
        ) : undefined
      }
      footer={
        cameraStatus === "processing" ? (
          <div className="w-full text-center text-[12px] text-slate-500" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
            This takes about 10 seconds
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCapturePhoto}
            disabled={cameraStatus !== "preview"}
            className={`ml-auto inline-flex h-11 min-h-[44px] min-w-[7rem] items-center justify-center rounded-lg px-6 text-[14px] font-semibold transition-colors ${
              cameraStatus === "preview"
                ? "bg-dokimos-accent text-white shadow-sm hover:bg-dokimos-accentHover"
                : "cursor-not-allowed bg-slate-300 text-slate-500"
            }`}
          >
            Next
          </button>
        )
      }
    >
      <div
        className={`relative w-full min-h-[280px] overflow-hidden rounded-xl border transition-colors sm:min-h-[320px] ${
          cameraStatus === "processing"
            ? "border-emerald-400 bg-emerald-50/50"
            : cameraStatus === "error"
              ? "border-red-200 bg-slate-900"
              : cameraStatus === "preview"
                ? "border-dokimos-accent bg-gray-900"
                : "border border-slate-200 bg-slate-900"
        }`}
      >
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-150 ${
            cameraStatus === "preview" || cameraStatus === "processing"
              ? "z-0 opacity-100"
              : "z-0 opacity-0"
          }`}
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {cameraStatus === "starting" && (
          <div className="absolute inset-0 flex min-h-[280px] flex-col items-center justify-center px-4 sm:min-h-[320px]">
            <p
              className="text-center text-[16px] font-medium text-white"
              style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
            >
              Starting camera…
            </p>
          </div>
        )}

        {cameraStatus === "preview" && (
          <div className="pointer-events-none absolute inset-0 flex min-h-[280px] items-center justify-center sm:min-h-[320px]" aria-hidden>
            <div className="h-52 w-40 rounded-full border-2 border-dashed border-white/40" />
          </div>
        )}

        {cameraStatus === "error" && (
          <div className="absolute inset-0 flex min-h-[280px] flex-col items-center justify-center px-4 sm:min-h-[320px]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle size={32} className="text-red-600" />
            </div>
            <p
              className="text-[15px] font-medium text-white/90"
              style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
            >
              Camera unavailable
            </p>
          </div>
        )}

        {cameraStatus === "processing" && (
          <div className="absolute inset-0 flex min-h-[280px] flex-col items-center justify-center bg-[#0F1B4C]/90 sm:min-h-[320px]">
            <p
              className="mb-3 text-[15px] font-medium text-white"
              style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
            >
              Continuing…
            </p>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-dokimos-accent"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="h-2 w-2 rounded-full bg-dokimos-accent"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-dokimos-accent"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </div>
        )}
      </div>
    </PlaidSplitOnboardingLayout>
  );
}

/** Calls TEE /verify with stored ID image + live selfie after liveness. */
export function Screen02VerifyProcessing({
  onBack,
  onSuccess,
  setAttestationData,
}: {
  onBack: () => void;
  onSuccess: () => void;
  setAttestationData: (data: AttestationData) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      let idImg: string | null = null;
      let live: string | null = null;
      try {
        idImg = localStorage.getItem("dokimos_stored_image");
        live = localStorage.getItem(STORAGE_LIVE_PHOTO);
      } catch {
        setError("Could not read stored images.");
        return;
      }
      if (!idImg || !live) {
        setError("Missing ID or selfie. Go back and complete the previous steps.");
        return;
      }
      try {
        const response = await axios.post("/api/verify", {
          imageBase64: idImg,
          livePhotoBase64: live,
          requestedAttributes: [],
        });
        const raw = response.data as AttestationData & {
          encryptedIdStored?: boolean;
        };
        const { encryptedIdStored, ...attestationPayload } = raw;
        setAttestationData(attestationPayload);
        if (encryptedIdStored) {
          try {
            localStorage.setItem(STORAGE_HAS_ENCRYPTED_ID, "1");
          } catch {
            /* ignore */
          }
        }
        try {
          localStorage.removeItem(STORAGE_LIVE_PHOTO);
        } catch {
          /* ignore */
        }
        onSuccess();
      } catch {
        setError("Verification failed. Please try again.");
      }
    };

    void run();
  }, [onSuccess, setAttestationData]);

  return (
    <AppFlowScreenLayout>
      <div className="flex h-11 shrink-0 items-center sm:h-[52px]">
        <button type="button" onClick={onBack} className="-ml-1 rounded-lg p-1 hover:bg-gray-200/60" aria-label="Back">
          <ArrowLeft size={24} className="text-gray-900" />
        </button>
      </div>
      <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center px-0 py-12 pb-16 sm:min-h-0 sm:py-16 sm:pb-24">
        {error ? (
          <>
            <p
              className="text-center text-sm text-red-600 sm:text-[15px]"
              style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
            >
              {error}
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-6 h-12 min-h-[44px] rounded-xl bg-dokimos-accent px-8 text-sm font-medium text-white transition-colors hover:bg-dokimos-accentHover sm:text-[15px]"
              style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
            >
              Go back
            </button>
          </>
        ) : (
          <>
            <p
              className="text-sm font-medium text-gray-900 sm:text-[15px]"
              style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
            >
              Verifying in TEE…
            </p>
            <p className="mt-2 max-w-md text-center text-xs text-gray-500 sm:text-[13px]">
              OCR, face match, and signing — this can take up to a minute.
            </p>
            <div className="mt-8 flex items-center gap-1.5">
              <motion.div
                className="h-2 w-2 rounded-full bg-dokimos-accent"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="h-2.5 w-2.5 rounded-full bg-dokimos-accent"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
              />
              <motion.div
                className="h-2 w-2 rounded-full bg-dokimos-accent"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </>
        )}
      </div>
    </AppFlowScreenLayout>
  );
}

// Screen 03 - Identity vault (user-focused, fintech-style layout)
export function Screen03Vault({
  onBack,
  attestationData,
  showHeaderBack = true,
}: {
  onBack?: () => void;
  attestationData: AttestationData | null;
  /** When false, vault is the app home (tabs only; no back to onboarding). */
  showHeaderBack?: boolean;
}) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { setSelectedRequest, setAttestationData } = useDokimosApp();
  const { openHowItWorks } = useHowItWorksModal();

  const attributes = useMemo(
    () => attestationData?.attributes ?? VAULT_DEMO_ATTRIBUTES,
    [attestationData]
  );

  const documentTypeHeading = useMemo(() => {
    const v = attributes.documentType;
    if (typeof v !== "string" || !v.trim() || v === "Unknown") return null;
    return formatVaultAttributeDisplay("documentType", v);
  }, [attributes]);

  const cardAttributeEntries = useMemo(
    () => Object.entries(attributes).filter(([k]) => k !== "documentType"),
    [attributes]
  );

  const groupedAttributes = useMemo(
    () => groupVaultAttributes(cardAttributeEntries as [string, string | boolean][]),
    [cardAttributeEntries]
  );

  const [pendingRequests, setPendingRequests] = useState<VerificationRequest[]>([]);
  const [allRequests, setAllRequests] = useState<VerificationRequest[]>([]);

  const hubActions = useMemo(() => {
    const n = pendingRequests.length;
    const actions: HubAction[] = [];
    if (n > 0) {
      actions.push({
        href: "/app/requests",
        label: "Review pending",
        variant: "primary",
        badge: n,
      });
    }
    actions.push({
      href: "/app/requests",
      label: "Activity & history",
      variant: n > 0 ? "secondary" : "primary",
    });
    actions.push({
      onClick: openHowItWorks,
      label: "How Dokimos works",
      variant: "secondary",
    });
    return actions;
  }, [pendingRequests.length, openHowItWorks]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [hasEncryptedId, setHasEncryptedId] = useState(false);
  const [reVerifyLoading, setReVerifyLoading] = useState(false);
  const [reVerifyError, setReVerifyError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setHasEncryptedId(localStorage.getItem(STORAGE_HAS_ENCRYPTED_ID) === "1");
    } catch {
      setHasEncryptedId(false);
    }
  }, []);

  const timestamp = attestationData?.timestamp
    ? new Date(attestationData.timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

  const verificationUrl =
    attestationData?.eigen?.verificationUrl ??
    getEigenVerificationDashboardUrl(attestationData?.eigen?.appId);

  const fetchPending = useCallback(async () => {
    try {
      let email: string | null =
        sessionStatus === "authenticated" && session?.user?.email
          ? session.user.email
          : null;
      if (!email) {
        const userSession = localStorage.getItem("dokimos_user");
        if (userSession) {
          try {
            email = (JSON.parse(userSession) as { email?: string }).email ?? null;
          } catch {
            /* ignore */
          }
        }
      }
      if (!email) {
        setPendingRequests([]);
        setAllRequests([]);
        return;
      }
      const response = await axios.get(
        `/api/requests/user/${encodeURIComponent(email)}`,
        { timeout: 15000 }
      );
      const raw = response.data;
      const list: VerificationRequest[] = Array.isArray(raw)
        ? raw
        : raw && typeof raw === "object" && Array.isArray((raw as { requests?: unknown }).requests)
          ? (raw as { requests: VerificationRequest[] }).requests
          : [];
      setAllRequests(list);
      setPendingRequests(list.filter((r) => r.status === "pending"));
    } catch {
      setPendingRequests([]);
      setAllRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [sessionStatus, session?.user?.email]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    void fetchPending();
    const t = setInterval(fetchPending, 15000);
    return () => clearInterval(t);
  }, [sessionStatus, session?.user?.email, fetchPending]);

  const handleReviewRequest = (req: VerificationRequest) => {
    setSelectedRequest(req);
    router.push("/app/requests/review");
  };

  const handleReVerify = async () => {
    setReVerifyError(null);
    setReVerifyLoading(true);
    try {
      const { data } = await axios.post<AttestationData>(
        "/api/re-verify",
        {}
      );
      setAttestationData(data);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : "Re-verification failed. Try again or re-upload your ID.";
      setReVerifyError(msg);
    } finally {
      setReVerifyLoading(false);
    }
  };

  const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

  function VaultMainSections() {
    const primaryEntries = sortIdentityEntries(groupedAttributes.identity);
    const additionalEntries = [
      ...groupedAttributes.document,
      ...groupedAttributes.eligibility,
      ...groupedAttributes.other,
    ] as [string, string | boolean][];
    return (
      <>
        <div>
          <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-500" style={{ fontFamily: sans }}>
            Next steps
          </p>
          <DokimosHubActionRow actions={hubActions} />
        </div>

        <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
          <div className="space-y-6 lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50/90 to-white px-4 py-4 shadow-sm shadow-emerald-900/[0.06] sm:px-5">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 shadow-sm ring-2 ring-emerald-500/25">
                  <Check size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-emerald-900" style={{ fontFamily: sans }}>
                    Identity verified
                  </p>
                  <p className="mt-0.5 text-[13px] text-slate-600" style={{ fontFamily: sans }}>
                    {timestamp}
                  </p>
                  {attestationData?.reVerified ? (
                    <p className="mt-1 text-[12px] font-medium text-emerald-800" style={{ fontFamily: sans }}>
                      Refreshed from your stored ID (re-verification)
                    </p>
                  ) : null}
                </div>
              </div>

              {attestationData?.biometricVerification ? (
                <div
                  className={`mt-4 flex items-start gap-3 rounded-xl border px-3 py-3 sm:px-4 ${
                    attestationData.biometricVerification.faceMatch
                      ? "border-emerald-200/80 bg-white/80"
                      : "border-amber-200 bg-amber-50/70"
                  }`}
                >
                  {attestationData.biometricVerification.faceMatch ? (
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" strokeWidth={2.5} />
                  ) : (
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" strokeWidth={2.5} />
                  )}
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: sans }}>
                      {attestationData.biometricVerification.faceMatch
                        ? "Face matched to ID"
                        : "Face match check did not pass"}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-600" style={{ fontFamily: sans }}>
                      Confidence {(attestationData.biometricVerification.confidence * 100).toFixed(1)}%
                      {attestationData.biometricVerification.error
                        ? ` — ${attestationData.biometricVerification.error}`
                        : ""}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <VaultCredentialRowList
              primaryEntries={primaryEntries}
              documentTypeLabel={documentTypeHeading}
              additionalEntries={additionalEntries}
              sans={sans}
            />
          </div>

          <div className="space-y-6 lg:col-span-2">
            <section aria-labelledby="pending-heading">
              <h3
                id="pending-heading"
                className="mb-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                style={{ fontFamily: sans }}
              >
                Pending requests
              </h3>
              {!requestsLoading && pendingRequests.length > 0 && (
                <p className="mb-3 text-[12px] text-slate-500" style={{ fontFamily: sans }}>
                  {pendingRequests.length} active
                </p>
              )}

              {requestsLoading ? (
                <div
                  className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-[14px] text-slate-500"
                  style={{ fontFamily: sans }}
                >
                  Loading requests…
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
                  <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" strokeWidth={1.5} aria-hidden />
                  <p className="text-[15px] font-medium text-slate-700" style={{ fontFamily: sans }}>
                    Nothing pending
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500" style={{ fontFamily: sans }}>
                    When an organization asks for a verified proof, it will show up here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {pendingRequests.map((req) => (
                    <li key={req.requestId}>
                      <button
                        type="button"
                        onClick={() => handleReviewRequest(req)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50/80"
                      >
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-slate-900" style={{ fontFamily: sans }}>
                            {req.verifierName || "Verification request"}
                          </p>
                          <p className="mt-0.5 text-[13px] text-slate-500" style={{ fontFamily: sans }}>
                            {req.requestedAttributes.length}{" "}
                            {req.requestedAttributes.length === 1 ? "attribute" : "attributes"} requested
                          </p>
                        </div>
                        <span className="shrink-0 text-[13px] font-medium text-emerald-700" style={{ fontFamily: sans }}>
                          Review →
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {!requestsLoading && pendingRequests.length > 0 && (
                <Link
                  href="/app/requests"
                  className="mt-3 block text-center text-[13px] font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900"
                  style={{ fontFamily: sans }}
                >
                  View all requests
                </Link>
              )}
            </section>

            {hasEncryptedId ? (
              <DokimosSurfaceCard className="border-emerald-200/80 bg-emerald-50/50">
                <h3
                  id="reverify-heading"
                  className="text-[15px] font-semibold text-slate-900"
                  style={{ fontFamily: sans }}
                >
                  Re-verify without re-uploading
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600" style={{ fontFamily: sans }}>
                  Your ID image is encrypted and held in the verification service memory (demo) so you can
                  refresh your attestation after a new session or device—without uploading again.
                </p>
                {sessionStatus === "authenticated" ? (
                  <button
                    type="button"
                    onClick={handleReVerify}
                    disabled={reVerifyLoading}
                    className="mt-4 h-12 min-h-[44px] w-full rounded-xl border border-emerald-700/30 bg-white text-[14px] font-semibold text-emerald-900 shadow-sm transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ fontFamily: sans }}
                  >
                    {reVerifyLoading ? "Re-verifying…" : "Re-verify identity"}
                  </button>
                ) : (
                  <p className="mt-3 text-[13px] text-slate-600" style={{ fontFamily: sans }}>
                    Sign in with Google to re-verify using your stored ID.
                  </p>
                )}
                {reVerifyError ? (
                  <p className="mt-3 text-[13px] text-red-600" role="alert" style={{ fontFamily: sans }}>
                    {reVerifyError}
                  </p>
                ) : null}
              </DokimosSurfaceCard>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  if (!showHeaderBack) {
    return (
      <VaultNavigationDashboard
        verificationUrl={verificationUrl}
        attestationData={attestationData}
        pendingRequests={pendingRequests}
        allRequests={allRequests}
        requestsLoading={requestsLoading}
        sessionStatus={sessionStatus}
        hasEncryptedId={hasEncryptedId}
        reVerifyLoading={reVerifyLoading}
        reVerifyError={reVerifyError}
        onReVerify={handleReVerify}
        onReviewRequest={handleReviewRequest}
      />
    );
  }

  const handleVaultBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <div className="relative w-full">
      <div className="relative flex h-11 shrink-0 items-center justify-between gap-2 px-4 sm:h-[52px] sm:px-5 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {showHeaderBack ? (
            <>
              <button
                type="button"
                onClick={handleVaultBack}
                className="-ml-1 rounded-lg p-1 transition-colors hover:bg-slate-200/60"
                aria-label="Back"
              >
                <ArrowLeft size={24} className="text-slate-900" />
              </button>
              <span
                className="text-[17px] font-bold tracking-tight text-[#0F1B4C]"
                style={{ fontFamily: sans }}
              >
                Dokimos
              </span>
            </>
          ) : null}
        </div>
        {!showHeaderBack ? (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[17px] font-bold tracking-tight text-[#0F1B4C]"
            style={{ fontFamily: sans }}
          >
            Dokimos
          </span>
        ) : null}
        <VaultInfoMenu verificationUrl={verificationUrl} />
      </div>

      <DokimosPageChrome
        role="hub"
        roleLabel="Home"
        title="Your Identity Vault"
        description="When companies need to verify your identity, you can approve or decline each request. Your details stay private."
      >
        <VaultMainSections />
      </DokimosPageChrome>
    </div>
  );
}

// Screen 04 - Review & approve verifier request (full page inside app shell)
export function Screen04Share({
  onNext,
  onAfterDeny,
  selectedRequest,
  setAttestationData,
}: {
  onNext: () => void;
  /** After successful deny API — return user to Requests tab */
  onAfterDeny: () => void;
  selectedRequest: VerificationRequest | null;
  setAttestationData: (data: AttestationData) => void;
}) {
  const { storedImageData, setStoredImageData } = useDokimosApp();
  const [submitting, setSubmitting] = useState(false);
  const reviewFileRef = useRef<HTMLInputElement>(null);

  const onReviewPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!ALLOWED.includes(file.type.toLowerCase())) {
      alert("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be 10MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      setStoredImageData(base64);
      try {
        localStorage.setItem("dokimos_stored_image", base64);
      } catch {
        /* ignore */
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !storedImageData) {
      console.error("Missing request or image data");
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post("/api/approve-request", {
        requestId: selectedRequest.requestId,
        approved: true,
        imageBase64: storedImageData,
      });

      // Store the attestation data
      if (response.data.attestation) {
        setAttestationData(response.data.attestation);
      }

      onNext(); // Navigate to receipt
    } catch (error) {
      console.error("Failed to approve request:", error);
      alert("Failed to approve request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);

    try {
      await axios.post("/api/approve-request", {
        requestId: selectedRequest.requestId,
        approved: false,
      });

      onAfterDeny();
    } catch (error) {
      console.error("Failed to deny request:", error);
      alert("Failed to deny request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return then.toLocaleString();
  };

  // Fallback to demo data if no real request
  const companyName = selectedRequest?.verifierName || "Acme Brokerage";
  const companyInitial = companyName.charAt(0);
  const requestedAttrs = selectedRequest?.requestedAttributes || ["name", "ageOver21", "notExpired"];
  const requestTime = selectedRequest ? getRelativeTime(selectedRequest.createdAt) : "2 minutes ago";
  const wfLabel = workflowDisplayName(selectedRequest?.workflow);

  return (
    <div className="relative w-full px-4 pb-8 pt-4 sm:px-5 md:px-6 md:pb-10">
      <input
        ref={reviewFileRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={onReviewPickFile}
        aria-hidden
      />
      <div className="mx-auto w-full max-w-[600px] rounded-[28px] border border-gray-100/90 bg-white p-5 shadow-[0_4px_24px_rgba(15,23,42,0.06)] sm:p-6">
        {/* Company header with trust badge */}
        <div className="mb-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium flex-shrink-0">
            {companyInitial}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p
                className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl md:text-[28px]"
                style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
              >
                {companyName}
              </p>
              <div className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-[10px] font-medium text-blue-700">
                Verified Partner
              </div>
            </div>
            <p className="text-[13px] text-gray-500 mb-1" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
              {wfLabel}
            </p>
            <p className="text-[11px] text-gray-400" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>Requested {requestTime}</p>
          </div>
        </div>

        <div className="w-full h-px bg-gray-200 my-4" />

        {/* Attributes list - no label, larger text */}
        <div className="space-y-0 mb-4">
          {requestedAttrs.map((attr, idx) => (
            <div key={idx} className="py-3.5 border-b border-gray-100">
              <p className="text-[16px] font-semibold text-gray-900" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
                {formatVerificationAttributeKey(attr)}
              </p>
            </div>
          ))}
        </div>

        {/* Combined trust and consent message */}
        <div className="mb-3 bg-[#F0FDF4] rounded-lg p-3.5 flex items-start gap-2.5">
          <Shield size={17} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] text-gray-700 leading-relaxed" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
              {companyName} receives proof you meet these {requestedAttrs.length} requirements. They cannot see your ID photo or any other personal details.
            </p>
            <p className="text-[11px] text-emerald-700 mt-1.5 font-medium" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
              Verified by Intel TDX Secure Enclave
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-4">
          <p className="mb-2 text-[13px] font-medium text-gray-800" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
            Government ID
          </p>
          {storedImageData ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[13px] text-emerald-700" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
                ID image ready for this approval.
              </p>
              <button
                type="button"
                onClick={() => reviewFileRef.current?.click()}
                className="text-[13px] font-semibold text-dokimos-accent underline-offset-2 hover:underline"
                style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
              >
                Change photo
              </button>
            </div>
          ) : (
            <>
              <p className="mb-3 text-[12px] text-gray-500" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
                Choose a photo of your ID. On your phone, you can take a picture or pick from your library.
              </p>
              <button
                type="button"
                onClick={() => reviewFileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-dokimos-accent py-3 text-[15px] font-semibold text-white hover:bg-dokimos-accentHover"
                style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
              >
                <ImagePlus size={18} strokeWidth={2} />
                Choose photo
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleApprove}
          disabled={submitting || !storedImageData}
          className="mt-2 flex h-12 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-dokimos-accent text-sm font-semibold text-white transition-colors hover:bg-dokimos-accentHover disabled:opacity-50 sm:h-14 sm:text-[15px]"
          style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
        >
          <Shield size={16} className="text-white" />
          {submitting ? "Approving..." : "Approve and Share"}
        </button>

        <button 
          onClick={handleDeny}
          disabled={submitting}
          className="mt-3 h-12 min-h-[44px] w-full rounded-xl border border-gray-200 bg-white text-sm font-semibold text-[#EF4444] transition-colors hover:bg-gray-50 disabled:opacity-50 sm:h-14 sm:text-[15px]"
          style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
        >
          {submitting ? "Processing..." : "Deny"}
        </button>
      </div>
    </div>
  );
}

// Screen 05 - Verification Receipt with REAL attestation data
export function Screen05Receipt({ 
  onNext, 
  onBack,
  attestationData,
  selectedRequest
}: { 
  onNext: () => void; 
  onBack: () => void;
  attestationData: AttestationData | null;
  selectedRequest: VerificationRequest | null;
}) {
  const [accordionOpen, setAccordionOpen] = useState(false);

  const companyName = selectedRequest?.verifierName || "Unknown Company";

  const truncate = (str: string, length: number = 6) => {
    if (str.length <= length * 2) return str;
    return `${str.slice(0, length)}...${str.slice(-length)}`;
  };

  const timestamp = attestationData?.timestamp 
    ? new Date(attestationData.timestamp).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "April 1, 2026";

  return (
    <div className="relative w-full">
      <div className="mx-auto max-w-[600px] px-4 pb-8 pt-6 sm:px-5 md:px-6 md:pb-10">
        <h1
          className="text-center text-[17px] font-bold text-[#0F1B4C]"
          style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
        >
          Dokimos
        </h1>

      <div className="mt-6 flex flex-col items-center px-0 pb-4 sm:mt-8">
        <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center mb-5">
          <Check size={40} className="text-white" />
        </div>

        <h2
          className="mb-4 text-4xl font-bold text-emerald-600 sm:text-5xl md:text-[56px]"
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          Verified
        </h2>

        <div className="my-4 h-px w-full bg-gray-200" />

        <p
          className="mb-2 text-center text-lg font-medium text-gray-900 sm:text-[22px]"
          style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
        >
          Shared with {companyName}
        </p>
        <p className="text-[13px] text-gray-500 mb-4" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
          Verified on {timestamp}
        </p>

        {/* Eigen Branding Badge */}
        <div className="mb-6 w-full rounded-xl border border-teal-200 bg-gradient-to-r from-teal-50 to-slate-50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dokimos-accent">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-900" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
                Powered by EigenCompute
              </p>
              <p className="text-xs text-teal-700" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
                Intel TDX Trusted Execution Environment
              </p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-teal-800" style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}>
            This verification ran in secure hardware. The cryptographic proof can be independently verified by anyone using Eigen's attestation infrastructure.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAccordionOpen(!accordionOpen)}
          className="mb-4 flex h-12 min-h-[44px] w-full items-center justify-between rounded-xl border border-gray-200 px-4"
        >
          <span className="text-[15px] font-medium text-gray-900">How is this verified?</span>
          <span className={`transform transition-transform ${accordionOpen ? "rotate-180" : ""}`}>▼</span>
        </button>

        {accordionOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="w-full mb-4 px-4 text-[14px] text-gray-600 leading-relaxed"
          >
            This attestation was generated by code running inside an Intel TDX Trusted Execution Environment. 
            The signature below was produced by a wallet that only that specific, auditable code can access. 
            You can verify this yourself using the buttons below.
          </motion.div>
        )}

        {attestationData && (
          <>
            <a
              href={`https://etherscan.io/verifiedSignatures?${new URLSearchParams({
                a: attestationData.signer,
                m: attestationData.message,
                s: attestationData.signature
              })}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 border border-gray-200 rounded-xl px-4 flex items-center justify-between mb-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-200" />
                <span className="text-[14px] font-medium text-gray-900">Verify Signature on Etherscan</span>
              </div>
              <ExternalLink size={16} className="text-dokimos-accent" />
            </a>

            <a
              href={
                attestationData?.eigen?.verificationUrl ??
                getEigenVerificationDashboardUrl(attestationData?.eigen?.appId)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 border border-gray-200 rounded-xl px-4 flex items-center justify-between mb-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#0F1B4C] rounded" />
                <span className="text-[14px] font-medium text-gray-900">View Code on EigenCloud Dashboard</span>
              </div>
              <ExternalLink size={16} className="text-dokimos-accent" />
            </a>
          </>
        )}

        <div className="w-full bg-[#0F1B4C] rounded-xl p-4 relative">
          <button className="absolute top-4 right-4 text-[11px] text-gray-400 hover:text-gray-300">
            <Copy size={12} className="inline" /> Copy all
          </button>
          {attestationData ? (
            <pre className="text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all">
              <span className="text-gray-400">message:</span> <span className="text-gray-200">{attestationData.message}</span>{"\n"}
              <span className="text-gray-400">messageHash:</span> <span className="text-gray-200">{truncate(attestationData.messageHash, 6)}</span>{"\n"}
              <span className="text-gray-400">signature:</span> <span className="text-teal-600">{truncate(attestationData.signature, 8)}</span>{"\n"}
              <span className="text-gray-400">signer:</span> <span className="text-teal-600">{truncate(attestationData.signer, 6)}</span>
            </pre>
          ) : (
            <pre className="text-[11px] font-mono overflow-x-auto">
              <span className="text-gray-400">message:</span> <span className="text-gray-200">Age Over 21</span>{"\n"}
              <span className="text-gray-400">messageHash:</span> <span className="text-gray-200">0x7f9a3b...8f9a</span>{"\n"}
              <span className="text-gray-400">signature:</span> <span className="text-teal-600">0x8a4c5e...3c4d</span>{"\n"}
              <span className="text-gray-400">signer:</span> <span className="text-teal-600">0x2b5f8c...5f8a</span>
            </pre>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-gray-400">
          Issued by Dokimos · Cryptographic identity infrastructure
        </p>

        <button
          type="button"
          onClick={onNext}
          className="mt-8 h-12 min-h-[44px] w-full max-w-md rounded-xl bg-dokimos-accent text-sm font-semibold text-white transition-colors hover:bg-dokimos-accentHover sm:h-14 sm:text-[15px]"
          style={{ fontFamily: "var(--font-instrument-sans), system-ui, sans-serif" }}
        >
          Done
        </button>
      </div>
      </div>
    </div>
  );
}

type ActivityTimeFilter = "all" | "month" | "quarter" | "older";

function requestSortDate(r: VerificationRequest): number {
  const t = r.completedAt || r.createdAt;
  return new Date(t).getTime();
}

function matchesActivityFilter(r: VerificationRequest, f: ActivityTimeFilter): boolean {
  const d = new Date(r.completedAt || r.createdAt);
  if (f === "all") return true;
  const now = new Date();
  if (f === "month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return d >= startOfMonth;
  }
  if (f === "quarter") {
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    return d >= cutoff;
  }
  if (f === "older") {
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    return d < cutoff;
  }
  return true;
}

// Screen 06 — Activity / history (SEQ 06 layout: filters + list rows)
export function Screen06History({
  onReviewRequest,
}: {
  onReviewRequest: (request: VerificationRequest) => void;
}) {
  const { data: session, status: sessionStatus } = useSession();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<ActivityTimeFilter>("all");

  const fetchRequests = async () => {
    try {
      setFetchError(null);
      let email: string | null =
        sessionStatus === "authenticated" && session?.user?.email
          ? session.user.email
          : null;
      if (!email) {
        const userSession = localStorage.getItem("dokimos_user");
        if (userSession) {
          try {
            email = (JSON.parse(userSession) as { email?: string }).email ?? null;
          } catch {
            /* ignore */
          }
        }
      }
      if (!email) {
        setRequests([]);
        return;
      }

      const response = await axios.get(
        `/api/requests/user/${encodeURIComponent(email)}`,
        { timeout: 15000 }
      );
      const raw = response.data;
      const list: VerificationRequest[] = Array.isArray(raw)
        ? raw
        : raw && typeof raw === "object" && Array.isArray((raw as { requests?: unknown }).requests)
          ? (raw as { requests: VerificationRequest[] }).requests
          : [];
      setRequests(list);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setFetchError("Could not load your verification history. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === "loading") return;

    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [sessionStatus, session?.user?.email]);

  const handleReviewRequest = (request: VerificationRequest) => {
    onReviewRequest(request);
  };

  const displayTime = (r: VerificationRequest) => {
    const ts = r.status === "pending" ? r.createdAt : r.completedAt || r.createdAt;
    return formatActivityRelative(ts);
  };

  const pendingList = useMemo(
    () =>
      requests
        .filter((r) => r.status === "pending")
        .sort((a, b) => requestSortDate(b) - requestSortDate(a)),
    [requests]
  );

  const completedFiltered = useMemo(() => {
    return requests
      .filter((r) => r.status !== "pending")
      .filter((r) => matchesActivityFilter(r, timeFilter))
      .sort((a, b) => requestSortDate(b) - requestSortDate(a));
  }, [requests, timeFilter]);

  const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;
  const serif = "var(--font-instrument-serif), Georgia, serif" as const;

  const filters: { id: ActivityTimeFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "month", label: "This month" },
    { id: "quarter", label: "Last 3 months" },
    { id: "older", label: "Older" },
  ];

  const renderRequestCard = (request: VerificationRequest) => {
    const initial = (request.verifierName ?? "?").charAt(0).toUpperCase();
    const badgeColor = getCompanyBadgeColor(request.verifierName ?? "");
    const attrs = getDisplayedAttributeKeys(request);
    const isPending = request.status === "pending";
    const approved = request.status === "approved";
    const denied = request.status === "denied";
    const wfLabel = workflowDisplayName(request.workflow);

    const RowInner = (
      <>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: badgeColor, fontFamily: sans }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-gray-900" style={{ fontFamily: sans }}>
            {request.verifierName ?? "Unknown"}
          </p>
          <p className="mt-0.5 text-[12px] text-[#6B7280]" style={{ fontFamily: sans }}>
            {wfLabel}
          </p>
          {isPending && (
            <p className="mt-1 text-[12px] font-medium text-amber-700" style={{ fontFamily: sans }}>
              Needs your response
            </p>
          )}
          <div className="mt-2 flex flex-col gap-1.5">
            {attrs.map((attr) => (
              <div key={attr} className="flex items-center gap-2">
                {isPending ? (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden />
                ) : approved ? (
                  <Check size={14} className="shrink-0 text-[#059669]" strokeWidth={2.5} aria-hidden />
                ) : (
                  <XCircle size={14} className="shrink-0 text-gray-400" aria-hidden />
                )}
                <span className="text-[13px] text-[#6B7280]" style={{ fontFamily: sans }}>
                  {formatVerificationAttributeKey(attr)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 self-start pt-0.5 text-right">
          <p className="text-[12px] text-[#9CA3AF]" style={{ fontFamily: sans }}>
            {displayTime(request)}
          </p>
          {denied && (
            <span
              className="mt-1 inline-block text-[11px] font-semibold text-red-600"
              style={{ fontFamily: sans }}
            >
              Declined
            </span>
          )}
        </div>
      </>
    );

    const cardClass =
      "flex w-full items-start gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 text-left shadow-sm";

    if (isPending) {
      return (
        <button
          key={request.requestId}
          type="button"
          onClick={() => handleReviewRequest(request)}
          className={`${cardClass} transition-colors hover:bg-gray-50/80`}
        >
          {RowInner}
        </button>
      );
    }

    return (
      <div key={request.requestId} className={cardClass}>
        {RowInner}
      </div>
    );
  };

  return (
    <div className="relative w-full overflow-x-hidden">
      <div className="flex h-11 shrink-0 items-center px-4 sm:h-[52px] sm:px-6">
        <span className="text-[17px] font-bold text-[#0F1B4C]" style={{ fontFamily: sans }}>
          Dokimos
        </span>
      </div>

      <DokimosPageChrome
        role="hub"
        roleLabel="Activity"
        title={"Where you're verified"}
        description="Every place you've shared a verified proof."
      >
      {fetchError ? (
        <div className="pb-4">
          <p className="text-center text-[14px] text-red-600" style={{ fontFamily: sans }}>
            {fetchError}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void fetchRequests();
            }}
            className="mx-auto mt-4 block rounded-xl bg-dokimos-accent px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-dokimos-accentHover"
            style={{ fontFamily: sans }}
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="py-12 text-center text-[14px] text-[#6B7280]" style={{ fontFamily: sans }}>
          Loading…
        </div>
      ) : requests.length === 0 ? (
        <div className="pb-12 pt-2 text-center">
          <p className="text-[15px] text-[#6B7280]" style={{ fontFamily: sans }}>
            No verification requests yet.
          </p>
          <p className="mt-1 text-[13px] text-[#9CA3AF]" style={{ fontFamily: sans }}>
            When an organization asks for a verified proof, it will show up here.
          </p>
        </div>
      ) : (
        <>
          {pendingList.length > 0 ? (
            <section className="pb-6" aria-labelledby="pending-heading">
              <h2
                id="pending-heading"
                className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]"
                style={{ fontFamily: sans }}
              >
                Pending
              </h2>
              <div className="space-y-3">{pendingList.map((r) => renderRequestCard(r))}</div>
            </section>
          ) : null}

          <section className="pb-10" aria-labelledby="completed-heading">
            <h2
              id="completed-heading"
              className="mb-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]"
              style={{ fontFamily: sans }}
            >
              Completed
            </h2>
            <p className="mb-3 text-[12px] text-[#9CA3AF]" style={{ fontFamily: sans }}>
              Filters apply to past verifications.
            </p>
            <div
              className="flex gap-2 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              role="tablist"
              aria-label="Time range for completed"
            >
              {filters.map((f) => {
                const active = timeFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTimeFilter(f.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-[#0F1B4C] text-white"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                    style={{ fontFamily: sans }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>

            {completedFiltered.length === 0 ? (
              <p
                className="py-10 text-center text-[14px] text-[#6B7280]"
                style={{ fontFamily: sans }}
              >
                No completed activity in this range.
              </p>
            ) : (
              <div className="space-y-3">{completedFiltered.map((r) => renderRequestCard(r))}</div>
            )}
            </section>
        </>
      )}
      </DokimosPageChrome>
    </div>
  );
}

function formatActivityRelative(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const calendarDiffDays = Math.round(
    (startOfToday.getTime() - startOfThen.getTime()) / 86400000
  );

  if (calendarDiffDays === 0) return "Today";
  if (calendarDiffDays === 1) return "Yesterday";
  if (calendarDiffDays < 7) {
    return `${calendarDiffDays} day${calendarDiffDays > 1 ? "s" : ""} ago`;
  }

  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
