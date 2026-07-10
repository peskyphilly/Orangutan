"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface FunnelLine {
  text: string;
  emphasis?: string; // the number, rendered in mono gold
}

const INTERVAL = 650;

export function ComposingSequence({
  lines,
  href,
}: {
  lines: FunnelLine[];
  href: string;
}) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(0);
  const [stamps, setStamps] = useState<number[]>([]);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    startRef.current = performance.now();

    if (reduced) {
      setRevealed(lines.length);
      setStamps(lines.map(() => 0));
      const t = setTimeout(() => router.push(href), 400);
      return () => clearTimeout(t);
    }

    router.prefetch(href);
    let i = 0;
    const tick = () => {
      i += 1;
      setRevealed(i);
      setStamps((s) => [...s, (performance.now() - startRef.current) / 1000]);
      if (i >= lines.length) {
        clearInterval(id);
        setTimeout(() => router.push(href), 750);
      }
    };
    const id = setInterval(tick, INTERVAL);
    // reveal the first line immediately
    tick();
    return () => clearInterval(id);
  }, [lines, href, router]);

  return (
    <div>
      <ol className="space-y-5">
        {lines.map((line, idx) => {
          const isOn = idx < revealed;
          return (
            <li
              key={idx}
              className={`flex items-baseline gap-4 transition-all duration-500 ${
                isOn ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              <span
                aria-hidden
                className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                  idx === revealed - 1 ? "bg-gold" : "bg-[rgba(198,167,110,0.4)]"
                }`}
              />
              <span className="flex-1 text-lg font-light leading-snug text-white">
                {line.emphasis ? (
                  <>
                    <span className="font-mono text-gold-soft">
                      {line.emphasis}
                    </span>{" "}
                  </>
                ) : null}
                {line.text}
              </span>
              <span className="font-mono text-xs text-dim">
                {isOn && stamps[idx] !== undefined
                  ? `${stamps[idx].toFixed(2)}s`
                  : ""}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-12 h-6">
        {revealed >= lines.length ? (
          <a
            href={href}
            className="font-mono text-xs uppercase tracking-[0.18em] text-gold underline-offset-4 hover:underline"
          >
            Continue →
          </a>
        ) : null}
      </div>
    </div>
  );
}
