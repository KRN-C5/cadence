"use client";

import Image from "next/image";
import { Reveal, SectionLabel } from "./Reveal";

/*
 * Gallery layout
 *  01  large image with its caption beside it
 *  02/03  two images staggered on a soft panel
 *  04  wide cinematic image with the caption set inside it
 * Corners are rounded, shadows are soft, and images drift slowly on hover.
 */

const R_LG = "rounded-[clamp(22px,2.8vw,44px)]";
const R_MD = "rounded-[clamp(16px,2vw,30px)]";

function Frame({
  src,
  alt,
  sizes,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`group relative isolate overflow-hidden bg-paper-2 shadow-[0_34px_60px_-36px_rgba(60,34,12,0.5)] ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        quality={90}
        sizes={sizes}
        priority={priority}
        className="object-cover transition-transform duration-[1600ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-ink/10"
        aria-hidden
      />
    </div>
  );
}

function Caption({
  n,
  title,
  line,
  className = "",
}: {
  n: string;
  title: string;
  line: string;
  className?: string;
}) {
  return (
    <figcaption className={`flex items-start gap-4 ${className}`}>
      <span className="mt-[7px] font-mono text-[10px] tracking-[0.14em] text-orange">
        {n}
      </span>
      <span className="block">
        <span className="display block text-[clamp(22px,2.2vw,32px)] leading-[1.05]">
          {title}
        </span>
        <span className="mt-2 block max-w-[30ch] text-[13px] leading-[1.6] text-muted">
          {line}
        </span>
      </span>
    </figcaption>
  );
}

export function Plates() {
  return (
    <section id="object" className="py-[clamp(72px,10vw,140px)]">
      <div className="container-x">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <SectionLabel index="04">The object</SectionLabel>
            <h2 className="display mt-5 max-w-[16ch] text-[clamp(34px,4.6vw,64px)] leading-[0.98]">
              Four ways to look at it.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="max-w-[30ch] text-[11px] leading-relaxed text-muted/80 sm:text-right">
              Concept renders. Illustrations, not photographs of a finished
              product.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 flex flex-col gap-[clamp(40px,6vw,96px)] lg:mt-16">
          {/* 01 — large image, caption beside it */}
          <Reveal>
            <figure className="grid items-end gap-6 lg:grid-cols-12 lg:gap-12">
              <Frame
                src="/assets/plates/plate-01.webp"
                alt="The barrel — Rounded, ribbed, and made to be nudged."
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
                className={`aspect-[4/3] w-full sm:aspect-[16/10] lg:col-span-8 ${R_LG}`}
              />
              <Caption
                n="01"
                title="The barrel"
                line="Rounded, ribbed, and made to be nudged."
                className="lg:col-span-4 lg:pb-4"
              />
            </figure>
          </Reveal>

          {/* 02 + 03 — staggered pair on a soft panel */}
          <Reveal>
            <div
              className={`bg-paper-2 p-[clamp(14px,3vw,44px)] ${R_LG}`}
            >
              <div className="grid gap-[clamp(28px,4vw,56px)] sm:grid-cols-12">
                <figure className="sm:col-span-5">
                  <Frame
                    src="/assets/plates/plate-02.webp"
                    alt="The gauge — A watch-style window shows what's left in the spring."
                    sizes="(max-width: 640px) 100vw, 40vw"
                    className={`aspect-[4/5] w-full ${R_MD}`}
                  />
                  <Caption
                    n="02"
                    title="The gauge"
                    line="A watch-style window shows what's left in the spring."
                    className="mt-5"
                  />
                </figure>

                <figure className="sm:col-span-7 sm:mt-[clamp(40px,9vw,140px)]">
                  <Frame
                    src="/assets/plates/plate-03.webp"
                    alt="The slot — One pocket aligns. One portion falls."
                    sizes="(max-width: 640px) 100vw, 56vw"
                    className={`aspect-[5/4] w-full ${R_MD}`}
                  />
                  <Caption
                    n="03"
                    title="The slot"
                    line="One pocket aligns. One portion falls."
                    className="mt-5"
                  />
                </figure>
              </div>
            </div>
          </Reveal>

          {/* 04 — wide image, caption inside */}
          <Reveal>
            <figure>
              <div className="relative">
                <Frame
                  src="/assets/plates/plate-04.webp"
                  alt="The reward — Not all at once. At the right pace."
                  sizes="(max-width: 1440px) 100vw, 1440px"
                  className={`aspect-[4/3] w-full sm:aspect-[16/9] lg:aspect-[21/9] ${R_LG}`}
                />
                <div
                  className={`pointer-events-none absolute inset-0 ${R_LG}`}
                  aria-hidden
                  style={{
                    background:
                      "linear-gradient(to top, rgba(18,15,13,0.72) 0%, rgba(18,15,13,0.2) 34%, rgba(18,15,13,0) 58%)",
                  }}
                />
                <figcaption className="absolute inset-x-[clamp(18px,3vw,44px)] bottom-[clamp(18px,3vw,40px)] flex items-start gap-4 text-paper">
                  <span className="mt-[7px] font-mono text-[10px] tracking-[0.14em] text-orange">
                    04
                  </span>
                  <span className="block">
                    <span className="display block text-[clamp(24px,2.8vw,40px)] leading-[1.02]">
                      The reward
                    </span>
                    <span className="mt-2 block max-w-[32ch] text-[13px] leading-[1.6] text-paper/75">
                      Not all at once. At the right pace.
                    </span>
                  </span>
                </figcaption>
              </div>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
