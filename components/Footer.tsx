"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

// Change this to the name you want shown in the footer.
const DEVELOPER = "Your Name";
const DEVELOPER_URL = "https://www.linkedin.com/in/krn-c5/";

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

        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Designed and developed by Kiran</p>
          <a
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 text-ink/80 transition-colors hover:text-ink"
            aria-label={`${DEVELOPER} on LinkedIn (opens in a new tab)`}
          >
            <span className="link-underline">LinkedIn</span>
            <ArrowUpRight
              size={13}
              strokeWidth={1.6}
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
