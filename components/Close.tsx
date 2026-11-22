"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";

export function Close() {
  return (
    <section id="reserve" className="relative isolate bg-ink text-paper">
      <div className="container-x grid min-h-[100svh] items-center gap-12 pb-14 pt-[104px] lg:grid-cols-12 lg:gap-16 lg:pb-16">
        <div className="lg:col-span-5">
          <Reveal>
            <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.22em] text-paper/55">
              <span className="text-orange">07</span>
              <span className="h-px w-8 bg-paper/25" aria-hidden />
              <span>The close</span>
            </div>

            <h2 className="display mt-8 text-[clamp(46px,6.3vw,102px)] leading-[0.92]">
              Make every roll
              <br />
              rewarding.
            </h2>

            <p className="mt-7 max-w-[36ch] text-[15px] leading-[1.65] text-paper/60">
              Give your dog&apos;s everyday playtime a little more thought.
              Reserve the first run — no payment today.
            </p>

            <div className="mt-9 flex flex-col items-start gap-3">
              <Link href="/checkout" className="btn btn-light group">
                Place order now
                <ArrowUpRight
                  size={16}
                  strokeWidth={1.6}
                  className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>
              <p className="text-[10px] uppercase tracking-[0.2em] text-paper/40">
                Small · Medium · Large — design targets
              </p>
            </div>

            <div className="mt-12 flex max-w-[38ch] flex-wrap gap-x-8 gap-y-2 border-t border-paper/12 pt-5 text-[10px] uppercase tracking-[0.16em] text-paper/40">
              <span>No payment today</span>
              <span>No app</span>
              <span>No batteries</span>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <Reveal delay={140}>
            <figure className="group relative isolate aspect-[4/5] w-full overflow-hidden rounded-[clamp(24px,3vw,44px)] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.7)] ring-1 ring-inset ring-paper/10 sm:aspect-[16/10] lg:aspect-auto lg:h-[calc(100svh-200px)]">
              <Image
                src="/assets/plates/poster-large.webp"
                alt="Concept render of the golden retriever sitting behind the Cadence treat roller"
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover object-[58%_center] transition-transform duration-[1800ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden
                style={{
                  background:
                    "linear-gradient(to top, rgba(18,15,13,0.78) 0%, rgba(18,15,13,0.24) 26%, rgba(18,15,13,0) 52%)",
                }}
              />
              <figcaption className="absolute inset-x-6 bottom-6 flex items-end justify-between gap-6 text-[9px] uppercase tracking-[0.18em] text-paper/60 sm:inset-x-8 sm:bottom-7">
                <span className="max-w-[26ch] leading-relaxed">
                  Concept render — not a photograph of the final product
                </span>
                <span className="shrink-0 font-mono text-paper/45">151 / 151</span>
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
