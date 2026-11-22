"use client";

import Image from "next/image";
import Link from "next/link";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "The film", href: "#film" },
      { label: "The movement", href: "#movement" },
      { label: "The mechanism", href: "#mechanism" },
      { label: "The object", href: "#object" },
    ],
  },
  {
    title: "Reserve",
    links: [
      { label: "Sizes", href: "#sizes" },
      { label: "Details", href: "#details" },
      { label: "Place an order", href: "/checkout" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="container-x py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Image
              src="/assets/brand/logo-small.webp"
              alt="Cadence — playful puppy treat logo"
              width={640}
              height={427}
              className="w-[132px]"
            />
            <p className="mt-5 max-w-[32ch] text-[12px] leading-relaxed text-muted">
              A self-winding treat roller, designed as a study in patience. No
              batteries, no app, no rush.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="lg:col-span-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="link-underline text-[13px] text-ink/80 transition-colors hover:text-ink"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-1 lg:text-right">
            <Link
              href="/checkout"
              className="link-underline text-[11px] uppercase tracking-[0.18em] text-orange"
            >
              Order
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 border-t border-line pt-6 text-[11px] text-muted/80 sm:grid-cols-3">
          <p>© 2026 Cadence. Concept study.</p>
          <p className="sm:text-center">
            Design targets, not tested numbers. Not a commercial product.
          </p>
          <p className="sm:text-right">
            Dry kibble or small treats only. Supervise play.
          </p>
        </div>
      </div>
    </footer>
  );
}
