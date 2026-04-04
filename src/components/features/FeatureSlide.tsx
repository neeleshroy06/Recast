"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

export type FeatureSlideProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** When true, skip vertical motion (reduced motion) */
  reduceMotion?: boolean;
};

/**
 * Entrance motion is self-timed (not scroll-linked). Parent switches `key` when the active feature changes.
 */
export function FeatureSlide({ icon: Icon, title, description, reduceMotion }: FeatureSlideProps) {
  return (
    <motion.div
      className="flex w-full max-w-lg flex-col items-center justify-center px-6 text-center sm:max-w-xl"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 48 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -28 }}
      transition={{
        opacity: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
        y: reduceMotion
          ? { duration: 0 }
          : { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
      }}
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-[var(--recast-accent-soft)] text-[var(--recast-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-[var(--recast-border)]/40 sm:h-28 sm:w-28">
        <Icon className="h-11 w-11 sm:h-12 sm:w-12" strokeWidth={1.5} />
      </div>
      <h3 className="mt-10 max-w-xl text-2xl font-semibold tracking-tight text-[var(--recast-text)] sm:mt-11 sm:text-3xl md:text-4xl">
        {title}
      </h3>
      <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[var(--recast-text-muted)] sm:mt-6 sm:text-lg md:text-xl">
        {description}
      </p>
    </motion.div>
  );
}
