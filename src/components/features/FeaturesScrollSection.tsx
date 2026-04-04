"use client";

import { useRef, useState } from "react";
import {
  AnimatePresence,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { FeatureSlide } from "./FeatureSlide";
import type { LucideIcon } from "lucide-react";

export type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type Props = {
  features: readonly FeatureItem[];
};

/** Scroll distance per feature band; animation is not tied to scroll position — only which band is active. */
const SCROLL_VH_PER_FEATURE = 220;
/** First feature scroll band is shorter so entering the section feels snappier (matches perceived pace of other slides). */
const FIRST_FEATURE_SCROLL_VH = 120;

function StaticFeatures({
  features,
}: {
  features: readonly { icon: LucideIcon; title: string; description: string }[];
}) {
  return (
    <section className="border-t border-[var(--recast-border)]/40 px-5 py-20 sm:px-8" aria-labelledby="features-heading-static">
      <div className="mx-auto max-w-3xl text-center">
        <h2
          id="features-heading-static"
          className="text-balance text-2xl font-semibold tracking-tight text-[var(--recast-text)] sm:text-3xl md:text-4xl"
        >
          What can Recast do for you?
        </h2>
      </div>
      <ul className="mx-auto mt-16 max-w-2xl space-y-20">
        {features.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--recast-accent-soft)] text-[var(--recast-accent)] ring-1 ring-[var(--recast-border)]/40">
              <Icon className="h-10 w-10" strokeWidth={1.5} />
            </div>
            <h3 className="mt-8 text-xl font-semibold text-[var(--recast-text)] sm:text-2xl">{title}</h3>
            <p className="mt-4 text-base leading-relaxed text-[var(--recast-text-muted)] sm:text-lg">{description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function segmentVhForIndex(index: number, n: number): number {
  return index === 0 ? FIRST_FEATURE_SCROLL_VH : SCROLL_VH_PER_FEATURE;
}

function activeIndexFromProgress(latest: number, n: number): number {
  if (n <= 0) return 0;
  let total = 0;
  const segments: number[] = [];
  for (let i = 0; i < n; i++) {
    const seg = segmentVhForIndex(i, n);
    segments.push(seg);
    total += seg;
  }
  let cum = 0;
  for (let i = 0; i < n; i++) {
    cum += segments[i] / total;
    if (latest < cum) return i;
  }
  return n - 1;
}

export function FeaturesScrollSection({ features }: Props) {
  const containerRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const n = features.length;
  const totalScrollVh = Array.from({ length: n }, (_, i) =>
    segmentVhForIndex(i, n),
  ).reduce((a, b) => a + b, 0);
  const scrollMultiplier = `${totalScrollVh}vh`;

  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const next = activeIndexFromProgress(latest, n);
    setActiveIndex((prev) => (prev !== next ? next : prev));
  });

  if (reduceMotion) {
    return <StaticFeatures features={features} />;
  }

  const current = features[activeIndex] ?? features[0];
  const Icon = current.icon;

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: scrollMultiplier }}
      aria-labelledby="features-heading"
    >
      <div className="sticky top-0 flex h-[100dvh] flex-col">
        <div className="z-30 shrink-0 px-5 pb-4 pt-14 sm:px-8 sm:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="features-heading"
              className="text-balance text-2xl font-semibold tracking-tight text-[var(--recast-text)] [text-shadow:var(--recast-sticky-text-shadow)] sm:text-3xl md:text-4xl"
            >
              What can Recast do for you?
            </h2>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <AnimatePresence mode="wait" initial={false}>
            <FeatureSlide
              key={activeIndex}
              icon={Icon}
              title={current.title}
              description={current.description}
              reduceMotion={false}
            />
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
