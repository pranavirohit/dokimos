"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinkClass =
  "rounded-full px-3 py-2.5 text-[15px] font-medium text-slate-800 transition-colors duration-150 hover:bg-white/60 hover:shadow-[0_4px_16px_rgba(13,148,136,0.1)] lg:px-4";

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-[100] pt-6">
      <div className="pointer-events-auto mx-auto w-full max-w-[min(100%-2rem,1160px)] px-5 sm:px-8 lg:px-10">
        <div
          className="flex items-center justify-between rounded-[40px] border border-white/50 bg-[hsla(0,0%,100%,0.55)] px-4 py-0 shadow-[0_8px_40px_rgba(71,85,105,0.1),0_4px_16px_rgba(13,148,136,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-[20px] sm:px-6 lg:h-[71px] lg:pl-6 lg:pr-[18px]"
          style={{ WebkitBackdropFilter: "blur(20px)" }}
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 py-3 text-[17px] font-bold tracking-tight text-slate-900 lg:py-0"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-slate-900 text-[13px] font-bold text-white shadow-[0_6px_20px_rgba(13,148,136,0.32)]">
              D
            </span>
            Dokimos
          </Link>

          <nav
            className={`font-landing absolute left-[13px] right-[13px] top-[calc(100%+8px)] z-50 flex flex-col gap-1 rounded-2xl border border-white/60 bg-white/90 p-3 shadow-[0_16px_48px_rgba(71,85,105,0.12)] backdrop-blur-xl lg:static lg:z-auto lg:flex lg:flex-1 lg:flex-row lg:items-center lg:justify-center lg:gap-1 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none ${
              open ? "flex" : "hidden lg:flex"
            }`}
            aria-label="Primary"
          >
            <a href="#product" className={navLinkClass} onClick={() => setOpen(false)}>
              Product
            </a>
            <a href="#how-it-works" className={navLinkClass} onClick={() => setOpen(false)}>
              How it works
            </a>
            <Link href="/integration" className={navLinkClass} onClick={() => setOpen(false)}>
              Developers
            </Link>
            <Link href="/business" className={navLinkClass} onClick={() => setOpen(false)}>
              For business
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/#footer"
              className="hidden h-10 items-center rounded-full border border-white/60 bg-white/70 px-5 text-[14px] font-semibold text-slate-800 shadow-[0_6px_20px_rgba(71,85,105,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-[0_8px_28px_rgba(71,85,105,0.14)] sm:inline-flex lg:h-[39px] lg:px-6 lg:text-[16px]"
            >
              Contact
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700 px-5 text-[14px] font-semibold text-white shadow-[0_8px_28px_rgba(13,148,136,0.32),inset_0_1px_0_rgba(255,255,255,0.22)] transition-[transform,box-shadow,filter] hover:-translate-y-px hover:shadow-[0_10px_32px_rgba(13,148,136,0.4)] lg:h-[39px] lg:px-6 lg:text-[16px]"
            >
              For Individuals
            </Link>
            <button
              type="button"
              className="rounded-xl p-2 text-slate-800 shadow-sm transition-shadow hover:shadow-md lg:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
