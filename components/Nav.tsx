"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useScrolled } from "@/lib/hooks";

const LINKS = [
  { label: "The film", href: "#film" },
  { label: "Movement", href: "#movement" },
  { label: "Mechanism", href: "#mechanism" },
  { label: "Sizes", href: "#sizes" },
];

const DARK = ["film", "mechanism", "reserve"];

export function Nav() {
  const scrolled = useScrolled(40);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [clear, setClear] = useState(false); // nav background transparent (film section only)
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? window.scrollY / h : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;

      const probe = 36; // middle of the 72px bar: switch exactly when a section passes under it
      let isDark = false;
      let isClear = false;
      for (const id of DARK) {
        const el = document.getElementById(id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.top <= probe && r.bottom >= probe) {
          isDark = true;
          isClear = id === "film"; // transparent only over the film section
          break;
        }
      }
      setDark(isDark);
      setClear(isClear);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,color] duration-300 motion-reduce:transition-none ${
          dark
            ? clear
              ? "border-b border-transparent bg-transparent text-paper"
              : "border-b border-transparent bg-ink/95 text-paper backdrop-blur-xl"
            : scrolled
              ? "border-b border-line bg-paper/95 text-ink backdrop-blur-xl"
              : "border-b border-transparent text-ink"
        }`}
      >
        <div className="container-x flex h-[72px] items-center justify-between gap-6">
          <Link href="/" className="flex items-baseline gap-3" aria-label="Cadence home">
            <span className="display text-[26px] leading-none">Cadence</span>
            <span
              className={`hidden text-[9px] uppercase tracking-[0.22em] transition-colors sm:block ${
                dark ? "text-paper/55" : "text-muted"
              }`}
            >
              Self-winding treat roller
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Sections">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`link-underline text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  dark
                    ? "text-paper/60 hover:text-paper"
                    : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/checkout"
              className={`btn h-10 px-5 text-[10px] ${
                dark ? "btn-light" : "btn-primary"
              }`}
            >
              Order now
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={`grid h-10 w-10 place-items-center border transition-colors lg:hidden ${
                dark
                  ? "border-paper/25 text-paper hover:border-paper"
                  : "border-line text-ink hover:border-ink"
              }`}
              aria-label="Open menu"
              aria-expanded={open}
            >
              <Menu size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px">
          <div
            ref={bar}
            className="h-px w-full origin-left bg-orange/70"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] bg-paper transition-[opacity,visibility] duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="container-x flex h-[72px] items-center justify-between">
          <span className="display text-[26px] leading-none">Cadence</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-10 w-10 place-items-center border border-line"
            aria-label="Close menu"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
        <nav className="container-x mt-10 flex flex-col" aria-label="Mobile">
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="hairline flex items-baseline justify-between py-5"
            >
              <span className="display text-[34px]">{l.label}</span>
              <span className="text-[10px] tracking-[0.2em] text-muted">
                0{i + 1}
              </span>
            </a>
          ))}
          <Link
            href="/checkout"
            onClick={() => setOpen(false)}
            className="btn btn-primary mt-10 w-full"
          >
            Order now
          </Link>
        </nav>
      </div>
    </>
  );
}
