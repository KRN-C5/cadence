"use client";

import { useEffect, useRef, useState } from "react";

const KEY = "cadence-sound";

export function AmbientAudio() {
  const audio = useRef<HTMLAudioElement>(null);
  const [enabled, setEnabled] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "off") setEnabled(false);
  }, []);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;

    a.volume = 0.3;

    if (!enabled) {
      a.pause();
      setPlaying(false);
      return;
    }

    let cancelled = false;
    const tryPlay = () => {
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    tryPlay();

    const events = ["pointerdown", "keydown", "touchstart", "click"] as const;
    const remove = () => events.forEach((e) => window.removeEventListener(e, kick));
    const kick = () => {
      if (cancelled) return;
      tryPlay();
      remove();
    };
    events.forEach((e) => window.addEventListener(e, kick, { passive: true }));

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    setPlaying(!a.paused);

    return () => {
      cancelled = true;
      remove();
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, [enabled]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;

    if (playing) {
      a.pause();
      setEnabled(false);
      window.localStorage.setItem(KEY, "off");
    } else {
      setEnabled(true);
      window.localStorage.setItem(KEY, "on");
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  };

  return (
    <>
      <audio
        ref={audio}
        src="/assets/audio/piano-cover.mp3"
        loop
        preload="auto"
        playsInline
        aria-hidden
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Turn background music off" : "Turn background music on"}
        className="fixed bottom-5 right-5 z-[70] flex items-center gap-2.5 rounded-full border border-line bg-paper/85 px-3.5 py-2.5 text-ink shadow-[0_1px_20px_rgba(30,27,24,0.08)] backdrop-blur-md transition-colors hover:border-ink/40"
      >
        <span className="flex h-3 items-end gap-[2.5px]" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-[2px] rounded-full bg-orange ${
                playing ? "eq" : "h-[3px] opacity-40"
              }`}
              style={{ animationDelay: `${i * 140}ms` }}
            />
          ))}
        </span>
        <span className="text-[9px] uppercase tracking-[0.2em]">
          {playing ? "Sound on" : enabled ? "Start sound" : "Sound off"}
        </span>
      </button>
    </>
  );
}
