"use client";

import { useEffect, useRef, useState } from "react";
import { SectionLabel } from "./Reveal";
import {
  FRAME_COUNT,
  getNearestFrame,
  loadAllFrames,
  subscribeFrames,
} from "@/lib/frames";
import { clamp, useStickyProgress } from "@/lib/hooks";

const CHAPTERS = [
  {
    n: "01",
    title: "Boredom",
    line: "Some afternoons, nothing happens.",
    sub: "A quiet room, a warm patch of carpet, and a toy that hasn't moved yet.",
    from: 0,
  },
  {
    n: "02",
    title: "Discovery",
    line: "Then something rolls.",
    sub: "Curiosity gets the better of him. A nudge. A wobble.",
    from: 0.18,
  },
  {
    n: "03",
    title: "Play",
    line: "It notices. It nudges.",
    sub: "Every push turns the barrel and winds the spring a little further.",
    from: 0.42,
  },
  {
    n: "04",
    title: "Reward",
    line: "One portion. Right on time.",
    sub: "The governor holds the release to a patient pace. Then the next.",
    from: 0.68,
  },
];

function chapterFor(p: number) {
  if (p < 0.18) return 0;
  if (p < 0.42) return 1;
  if (p < 0.68) return 2;
  return 3;
}

export function Film() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const frameLabel = useRef<HTMLSpanElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const chapterRef = useRef(0);

  const progress = useStickyProgress(section, (p) => {
    const c = chapterFor(p);
    if (c !== chapterRef.current) {
      chapterRef.current = c;
      setChapter(c);
    }
  });

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) loadAllFrames(0);
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    loadAllFrames(0);
    const unsub = subscribeFrames(() => {
      if (!loaded && getNearestFrame(0)) setLoaded(true);
    });
    return unsub;
  }, [loaded]);

  useEffect(() => {
    const cvs = canvas.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d", { alpha: false });
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let last = -1;
    let visible = true;

    const resize = () => {
      const rect = cvs.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      cvs.width = Math.round(w * dpr);
      cvs.height = Math.round(h * dpr);
      last = -1;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(cvs);
    resize();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) last = -1;
    });
    io.observe(cvs);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;

      const p = clamp(progress.current);
      const idx = Math.min(
        FRAME_COUNT - 1,
        Math.floor(p * (FRAME_COUNT - 1)),
      );

      if (rail.current) rail.current.style.transform = `scaleX(${p})`;
      if (frameLabel.current)
        frameLabel.current.textContent = String(idx + 1).padStart(3, "0");

      if (idx === last) return;
      const img = getNearestFrame(idx);
      if (!img) return;
      last = idx;

      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const scale = Math.max(w / iw, h / ih) * 1.015;
      const dw = iw * scale;
      const dh = ih * scale;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#171412";
      ctx.fillRect(0, 0, w, h);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [progress]);

  const jump = (i: number) => {
    const el = section.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    const top = el.offsetTop + total * CHAPTERS[i].from;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const active = CHAPTERS[chapter];

  return (
    <section
      id="film"
      ref={section}
      className="relative bg-ink"
      style={{ height: "420vh" }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <canvas
          ref={canvas}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="A golden retriever discovers and plays with the Cadence treat roller"
        />

        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "linear-gradient(to right, rgba(20,17,15,0.55) 0%, rgba(20,17,15,0.12) 34%, rgba(20,17,15,0) 58%), linear-gradient(to top, rgba(20,17,15,0.95) 0%, rgba(20,17,15,0.78) 26%, rgba(20,17,15,0.16) 54%, rgba(20,17,15,0) 74%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[26%]"
          aria-hidden
          style={{
            background:
              "linear-gradient(to bottom, rgba(20,17,15,0.55), rgba(20,17,15,0))",
          }}
        />

        <div className="absolute inset-x-0 top-[88px]">
          <div className="container-x flex items-start justify-between">
            <div className="flex items-center gap-5">
              <SectionLabel index="01" light>
                The film
              </SectionLabel>
              <span className="hidden border border-paper/20 px-2 py-1 text-[8px] uppercase tracking-[0.18em] text-paper/45 sm:block">
                Concept film
              </span>
            </div>
            <div className="text-right font-mono text-[10px] uppercase tracking-[0.18em] text-paper/55">
              <span className="hidden sm:inline">Frame </span>
              <span ref={frameLabel} className="tabular-nums text-paper/90">
                001
              </span>
              <span> / {FRAME_COUNT}</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="container-x pb-[clamp(28px,4vw,52px)] pr-24 sm:pr-36">
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.24em]">
              <span className="text-orange">{active.n}</span>
              <span className="h-px w-8 bg-paper/30" aria-hidden />
              <span className="text-paper/75">{active.title}</span>
            </div>

            <h2
              key={active.n}
              className="display caption-in mt-4 max-w-[16ch] text-[clamp(34px,5.6vw,78px)] text-paper"
            >
              {active.line}
            </h2>

            <p
              key={`${active.n}-sub`}
              className="caption-in mt-4 max-w-[44ch] text-[13px] leading-relaxed text-paper/65 sm:text-[14px]"
            >
              {active.sub}
            </p>

            <div className="mt-9 flex items-center gap-4">
              <div className="relative h-px flex-1 bg-paper/20">
                <div
                  ref={rail}
                  className="absolute inset-y-0 left-0 w-full origin-left bg-orange"
                  style={{ transform: "scaleX(0)" }}
                />
                {CHAPTERS.map((c, i) => (
                  <button
                    key={c.n}
                    type="button"
                    onClick={() => jump(i)}
                    className="absolute -top-2 h-4 w-8 -translate-x-1/2 cursor-pointer"
                    style={{ left: `${c.from * 100}%` }}
                    aria-label={`Jump to chapter ${c.n}: ${c.title}`}
                  >
                    <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-paper/50 transition-colors hover:bg-orange" />
                  </button>
                ))}
              </div>
              <div className="hidden items-center gap-5 sm:flex">
                {CHAPTERS.map((c, i) => (
                  <button
                    key={c.n}
                    type="button"
                    onClick={() => jump(i)}
                    className={`text-[10px] uppercase tracking-[0.18em] transition-colors ${
                      i === chapter ? "text-paper" : "text-paper/35 hover:text-paper/70"
                    }`}
                  >
                    {c.n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.3em] text-paper/40 transition-opacity duration-700 ${
            chapter === 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          Scroll to play
        </div>
      </div>
    </section>
  );
}
