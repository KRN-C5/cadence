"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal, SectionLabel } from "./Reveal";

const SIZES = [
  {
    id: "S",
    name: "Small",
    lengthCm: 12,
    diaCm: 7,
    pockets: "12 small pockets",
    audience: "Toy and small breeds",
  },
  {
    id: "M",
    name: "Medium",
    lengthCm: 18,
    diaCm: 10,
    pockets: "24 pockets",
    audience: "Small and medium breeds",
  },
  {
    id: "L",
    name: "Large",
    lengthCm: 24,
    diaCm: 13,
    pockets: "24 larger pockets",
    audience: "Large breeds",
  },
] as const;

const PX = 8; // millimetres on the sheet

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = polar(cx, cy, r, from);
  const [x2, y2] = polar(cx, cy, r, to);
  const large = to - from > 180 ? 1 : 0;
  return `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function Drawing({ size }: { size: (typeof SIZES)[number] }) {
  const bw = size.lengthCm * PX;
  const bh = size.diaCm * PX;
  const cx = 118;
  const cy = 108;
  const x0 = cx - bw / 2;
  const x1 = x0 + bw;
  const y0 = cy - bh / 2;
  const y1 = y0 + bh;
  const capW = Math.max(12, Math.min(22, bh * 0.24));
  const dimY = 176;
  const vdX = x1 + 16;
  const slotW = Math.max(8, bh * 0.14);
  const slotH = Math.max(10, bh * 0.18);
  const gcx = 305;
  const gr = bh / 2;
  const gaugeR = gr * 0.78;
  const tickR = gr * 0.6;

  const ribs = Array.from({ length: 10 }, (_, i) => {
    const t = (i + 0.5) / 10;
    return x0 + capW + (bw - capW * 2) * t;
  });

  const ticks = Array.from({ length: 9 }, (_, i) => 150 + (i / 8) * 240);

  return (
    <svg
      viewBox="0 0 380 232"
      className="w-full"
      role="img"
      aria-label={`${size.name} size: ${size.lengthCm} by ${size.diaCm} centimetres. Design target.`}
    >
      {/* centreline */}
      <line
        x1="16"
        y1={cy}
        x2="352"
        y2={cy}
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="2 5"
        opacity="0.22"
      />

      {/* side elevation */}
      <rect
        x={x0}
        y={y0 + bh * 0.02}
        width={capW}
        height={bh * 0.96}
        rx={capW * 0.32}
        fill="#2c2a27"
      />
      <rect
        x={x1 - capW}
        y={y0 + bh * 0.02}
        width={capW}
        height={bh * 0.96}
        rx={capW * 0.32}
        fill="#2c2a27"
      />
      <rect
        x={x0 + capW * 0.7}
        y={y0}
        width={bw - capW * 1.4}
        height={bh}
        rx={bh * 0.2}
        fill="#e85d1f"
      />
      {ribs.map((x, i) => (
        <line
          key={i}
          x1={x}
          y1={y0 + bh * 0.16}
          x2={x}
          y2={y1 - bh * 0.16}
          stroke="#1e1b18"
          strokeWidth="0.9"
          opacity="0.18"
        />
      ))}
      <rect
        x={cx + bw * 0.1}
        y={cy - slotH / 2}
        width={slotW}
        height={slotH}
        rx={slotW * 0.3}
        fill="#17140f"
      />

      {/* front elevation */}
      <circle cx={gcx} cy={cy} r={gr} fill="#2c2a27" />
      <circle
        cx={gcx}
        cy={cy}
        r={gr * 0.9}
        fill="#1b1916"
        stroke="#cfc9c0"
        strokeWidth="1.4"
      />
      <path
        d={arc(gcx, cy, gaugeR, 150, 230)}
        stroke="#93b94e"
        strokeWidth="3"
        fill="none"
      />
      <path
        d={arc(gcx, cy, gaugeR, 230, 310)}
        stroke="#e6b03a"
        strokeWidth="3"
        fill="none"
      />
      <path
        d={arc(gcx, cy, gaugeR, 310, 390)}
        stroke="#cc4529"
        strokeWidth="3"
        fill="none"
      />
      {ticks.map((deg) => {
        const [tx, ty] = polar(gcx, cy, tickR, deg);
        const [ix, iy] = polar(gcx, cy, tickR + gr * 0.1, deg);
        return (
          <line
            key={deg}
            x1={tx}
            y1={ty}
            x2={ix}
            y2={iy}
            stroke="#f2e7d6"
            strokeWidth="0.9"
            opacity="0.7"
          />
        );
      })}
      <line
        x1={gcx}
        y1={cy}
        x2={polar(gcx, cy, gr * 0.62, 300)[0]}
        y2={polar(gcx, cy, gr * 0.62, 300)[1]}
        stroke="#f2e7d6"
        strokeWidth="1.3"
      />
      <circle cx={gcx} cy={cy} r="1.8" fill="#f2e7d6" />

      {/* length dimension */}
      <g stroke="currentColor" strokeWidth="0.7" opacity="0.5">
        <line x1={x0} y1={dimY} x2={x1} y2={dimY} />
        <line x1={x0} y1={dimY - 5} x2={x0} y2={dimY + 5} />
        <line x1={x1} y1={dimY - 5} x2={x1} y2={dimY + 5} />
        <path d={`M${x0} ${dimY} l6 -2.6 v5.2 z`} fill="currentColor" stroke="none" />
        <path d={`M${x1} ${dimY} l-6 -2.6 v5.2 z`} fill="currentColor" stroke="none" />
      </g>
      <text
        x={cx}
        y={dimY + 16}
        textAnchor="middle"
        className="fill-ink text-[10px] tracking-[0.08em]"
      >
        {size.lengthCm} cm
      </text>

      {/* diameter dimension */}
      <g stroke="currentColor" strokeWidth="0.7" opacity="0.5">
        <line x1={vdX} y1={y0} x2={vdX} y2={y1} />
        <line x1={vdX - 5} y1={y0} x2={vdX + 5} y2={y0} />
        <line x1={vdX - 5} y1={y1} x2={vdX + 5} y2={y1} />
        <path d={`M${vdX} ${y0} l-2.6 6 h5.2 z`} fill="currentColor" stroke="none" />
        <path d={`M${vdX} ${y1} l-2.6 -6 h5.2 z`} fill="currentColor" stroke="none" />
      </g>
      <text
        x={vdX + 13}
        y={cy}
        textAnchor="middle"
        transform={`rotate(90 ${vdX + 13} ${cy})`}
        className="fill-ink text-[10px] tracking-[0.08em]"
      >
        {size.diaCm} cm
      </text>

      <text
        x={cx}
        y="214"
        textAnchor="middle"
        className="fill-muted text-[8px] uppercase tracking-[0.16em]"
      >
        Side elevation
      </text>
      <text
        x={gcx}
        y="214"
        textAnchor="middle"
        className="fill-muted text-[8px] uppercase tracking-[0.16em]"
      >
        Front elevation
      </text>
    </svg>
  );
}

export function Sizes() {
  const [active, setActive] = useState(1);
  const size = SIZES[active];

  return (
    <section id="sizes" className="border-y border-line bg-paper-2 py-[clamp(72px,10vw,140px)]">
      <div className="container-x">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <SectionLabel index="05">The sizes</SectionLabel>
            <h2 className="display mt-5 max-w-[18ch] text-[clamp(34px,4.6vw,64px)] leading-[0.98]">
              Three sizes. One idea.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="max-w-[32ch] text-[11px] leading-relaxed text-muted/80 sm:text-right">
              Dimensions and pocket counts are design targets, not tested
              numbers.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <div className="flex gap-1 border-b border-line pb-0">
              {SIZES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`relative -mb-px flex-1 border-b px-2 pb-3 text-left transition-colors sm:px-4 ${
                    active === i
                      ? "border-orange text-ink"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                  aria-pressed={active === i}
                >
                  <span className="block font-mono text-[10px] tracking-[0.12em] text-muted">
                    0{i + 1}
                  </span>
                  <span className="mt-1 block text-[13px] uppercase tracking-[0.16em]">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>

            <div key={size.id} className="pop-in mt-6 px-2 text-ink sm:px-6">
              <Drawing size={size} />
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-[10px] uppercase tracking-[0.18em] text-muted">
              <span>Two views</span>
              <span>Millimetres, design intent</span>
            </div>
          </div>

          <div className="flex flex-col justify-between lg:col-span-5">
            <div>
              <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                  Size
                </span>
                <span className="display text-[28px] leading-none">{size.name}</span>
              </div>

              <dl className="divide-y divide-line">
                {[
                  ["Body", `${size.lengthCm} × ${size.diaCm} cm`],
                  ["Pockets", size.pockets],
                  ["Best for", size.audience],
                  ["Fill", "Dry kibble or small treats"],
                  ["Power", "Self-winding, no batteries"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-6 py-3.5">
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
                      {k}
                    </dt>
                    <dd className="text-right text-[13px] text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 text-[11px] leading-relaxed text-muted/80">
                A larger body holds larger portions. The release interval is set
                by the governor, not by the size.
              </p>
            </div>

            <div className="mt-8">
              <Link
                href={`/checkout?size=${size.id}`}
                className="btn btn-primary group w-full sm:w-auto"
              >
                Place order now
                <ArrowUpRight
                  size={15}
                  strokeWidth={1.6}
                  className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
              <p className="mt-3 text-[11px] text-muted">
                Reserve the first run. No payment today.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
