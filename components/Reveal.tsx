"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
  once?: boolean;
};

export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className = "",
  once = true,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          if (once) io.disconnect();
        } else if (!once) {
          el.classList.remove("is-in");
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

export function SectionLabel({
  index,
  children,
  light = false,
}: {
  index: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 text-[11px] uppercase tracking-[0.2em] ${
        light ? "text-paper/60" : "text-muted"
      }`}
    >
      <span className={light ? "text-orange" : "text-orange"}>{index}</span>
      <span
        className={`h-px w-8 ${light ? "bg-paper/25" : "bg-line"}`}
        aria-hidden
      />
      <span>{children}</span>
    </div>
  );
}
