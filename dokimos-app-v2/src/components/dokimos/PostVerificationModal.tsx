"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { getEigenVerificationDashboardUrl } from "@/lib/eigenUrls";
import { STORAGE_POST_VERIFICATION_EXPLAINER_SEEN } from "@/types/dokimos";

const serif = "var(--font-instrument-serif), Georgia, serif" as const;
const sans = "var(--font-instrument-sans), system-ui, sans-serif" as const;

export type PostVerificationCloseSource = "dismiss" | "learn-more" | "verify-yourself";

type PostVerificationModalProps = {
  isOpen: boolean;
  onClose: (source: PostVerificationCloseSource) => void;
};

function markSeen() {
  try {
    localStorage.setItem(STORAGE_POST_VERIFICATION_EXPLAINER_SEEN, "1");
  } catch {
    /* ignore */
  }
}

export function PostVerificationModal({ isOpen, onClose }: PostVerificationModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleLearnMore = () => {
    markSeen();
    onClose("learn-more");
    router.push("/app/how-it-works");
  };

  const handleVerifyYourself = () => {
    markSeen();
    const url = getEigenVerificationDashboardUrl();
    window.open(url, "_blank", "noopener,noreferrer");
    onClose("verify-yourself");
  };

  const handleDismiss = () => {
    markSeen();
    onClose("dismiss");
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="post-verification-overlay"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100]"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
            aria-hidden
          />

          <div className="absolute inset-0 flex items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="post-verification-title"
              aria-describedby="post-verification-description"
              className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-900/20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="space-y-6 p-8 lg:p-10">
                <h2
                  id="post-verification-title"
                  className="text-[30px] font-normal leading-[1.2] tracking-tight text-slate-900 lg:text-[36px]"
                  style={{ fontFamily: serif }}
                >
                  What just happened?
                </h2>

                <p className="text-xl font-medium text-slate-900" style={{ fontFamily: sans }}>
                  Your ID is safe.
                </p>

                <div
                  id="post-verification-description"
                  className="space-y-4 text-base leading-relaxed text-slate-600"
                  style={{ fontFamily: sans }}
                >
                  <p>
                    We verified your ID document and confirmed your face matches it. But here&apos;s the important
                    part:{" "}
                    <strong className="font-semibold text-slate-900">
                      Dokimos never saw your actual document or photo.
                    </strong>
                  </p>

                  <p>Everything was processed in isolated, tamper-proof hardware that even we can&apos;t access.</p>

                  <p>
                    What you have now is a verified digital credential you can share with anyone, without ever
                    uploading your ID again.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row">
                <button
                  type="button"
                  onClick={handleLearnMore}
                  className="flex-1 rounded-lg bg-dokimos-accent px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-dokimos-accentHover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dokimos-accent"
                  style={{ fontFamily: sans }}
                >
                  Learn more
                </button>

                <button
                  type="button"
                  onClick={handleVerifyYourself}
                  className="flex-1 rounded-lg border border-slate-300 bg-transparent px-6 py-3 text-[15px] font-medium text-slate-700 transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                  style={{ fontFamily: sans }}
                >
                  Verify it yourself
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
