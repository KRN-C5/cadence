"use client";

import { useCallback, useEffect, useState } from "react";
import { Preloader } from "./Preloader";
import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { Statement } from "./Statement";
import { Film } from "./Film";
import { Movement } from "./Movement";
import { Mechanism } from "./Mechanism";
import { Plates } from "./Plates";
import { Sizes } from "./Sizes";
import { Details } from "./Details";
import { Close } from "./Close";
import { Footer } from "./Footer";

export function SiteShell() {
  const [loading, setLoading] = useState(true);

  const done = useCallback(() => setLoading(false), []);

  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  useEffect(() => {
    const safety = window.setTimeout(() => {
      document.documentElement.dataset.ready = "true";
      setLoading(false); // never leave the page locked if the preloader stalls
    }, 7000);
    return () => window.clearTimeout(safety);
  }, []);

  return (
    <>
      {loading ? <Preloader onDone={done} /> : null}

      <a
        href="#film"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:bg-ink focus:px-4 focus:py-2 focus:text-[12px] focus:text-paper"
      >
        Skip to the film
      </a>

      <Nav />
      <main>
        <Hero />
        <Statement />
        <Film />
        <Movement />
        <Mechanism />
        <Plates />
        <Sizes />
        <Details />
        <Close />
      </main>
      <Footer />
    </>
  );
}