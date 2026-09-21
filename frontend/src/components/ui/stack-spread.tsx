// Built using Hyperiux Vault: https://vault.hyperiux.com

"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Scale } from "lucide-react";
import { SparklesCore } from "@/components/ui/sparkles";

// Verified FMCG Packaging & Commodity Assets
const IMG = {
  dairy:
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80", // Packaged Dairy & Milk
  cosmetics:
    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80", // Cosmetics & Skincare
  pharma:
    "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80", // Pharmaceutical Carton
  coffee:
    "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80", // Packaged Coffee Pouch
  wellness:
    "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80", // Consumer Wellness Bottle
  fragrance:
    "https://images.unsplash.com/photo-1563178406-4cdc2923acbc?auto=format&fit=crop&w=800&q=80", // Fragrance Glass Packaging
  toiletries:
    "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?auto=format&fit=crop&w=800&q=80", // Toiletries Packaging Box
  personalCare:
    "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80", // FMCG Personal Care Tubes
} as const;

// per-image rest scale, keyed by img index (1-8). default 1, drop below to shrink.
const SCALE: Partial<Record<number, number>> = {
  1: 0.9,
  2: 0.8,
  3: 0.9,
  4: 0.8,
  5: 0.8,
  6: 0.9,
  7: 0.9,
  8: 0.7,
};
const s = (i: number) => SCALE[i] ?? 1;

// array order = stack order, back (z 2) -> front (z 9)
const CARDS: StackSpreadCard[] = [
  // top-left dairy (img08) — sm row 1 left
  {
    item: {
      src: IMG.dairy,
      alt: "Packaged Dairy & Milk",
      tag: "Rule 6(1)(c) • Net 500ml",
    },
    stackOffset: { x: -8, y: -10 },
    stackRotate: -18,
    target: { x: -20, y: -34, rotate: 0, scale: s(8), w: 17, h: 22 },
    targetSm: { x: -22, y: -40 },
    z: 2,
  },
  // top-right cosmetics (img07) — sm row 1 right
  {
    item: {
      src: IMG.cosmetics,
      alt: "Cosmetics & Skincare",
      tag: "Rule 6(1)(e) • Expiry 08/27",
    },
    stackOffset: { x: 14, y: -10 },
    stackRotate: 20,
    target: { x: 32, y: -30, rotate: 0, scale: s(7), w: 18, h: 32 },
    targetSm: { x: 22, y: -40 },
    z: 3,
  },
  // mid-left pharma (img06) — sm row 2 left
  {
    item: {
      src: IMG.pharma,
      alt: "Pharmaceutical Carton",
      tag: "Rule 6(1)(a) • Maker Verified",
    },
    stackOffset: { x: -16, y: 0 },
    stackRotate: -4,
    target: { x: -36, y: -2, rotate: 0, scale: s(6), w: 15, h: 32 },
    targetSm: { x: -22, y: -19 },
    z: 4,
  },
  // top-centre coffee pouch (img05) — sm row 2 right
  {
    item: {
      src: IMG.coffee,
      alt: "Packaged Coffee Pouch",
      tag: "Rule 6(1)(h) • MRP Cap OK",
    },
    stackOffset: { x: 1, y: -10 },
    stackRotate: -2,
    target: { x: 6, y: -32, rotate: 0, scale: s(5), w: 25, h: 30 },
    targetSm: { x: 22, y: -19 },
    z: 5,
  },
  // mid-right wellness (img04) — sm row 3 left
  {
    item: {
      src: IMG.wellness,
      alt: "Consumer Wellness Pack",
      tag: "Rule 6(1)(g) • Helpline 1800",
    },
    stackOffset: { x: 18, y: 1 },
    stackRotate: 6,
    target: { x: 37, y: 6, rotate: 0, scale: s(4), w: 18, h: 32 },
    targetSm: { x: -22, y: 20 },
    z: 6,
  },
  // bottom-left fragrance (img03) — sm row 3 right
  {
    item: {
      src: IMG.fragrance,
      alt: "Fragrance Glass Packaging",
      tag: "Rule 6(1)(f) • Origin: India",
    },
    stackOffset: { x: -6, y: 10 },
    stackRotate: 6,
    target: { x: -24, y: 34, rotate: 0, scale: s(3), w: 22, h: 25 },
    targetSm: { x: 22, y: 20 },
    z: 7,
  },
  // bottom-centre toiletries (img02) — sm row 4 left
  {
    item: {
      src: IMG.toiletries,
      alt: "Packaged Toiletries Box",
      tag: "Rule 7 • Font Ratio OK",
    },
    stackOffset: { x: 8, y: 7 },
    stackRotate: 3,
    target: { x: 2, y: 36, rotate: 0, scale: s(2), w: 20, h: 26 },
    targetSm: { x: -22, y: 40 },
    z: 8,
  },
  // bottom-right personal care (img01) — sm row 4 right
  {
    item: {
      src: IMG.personalCare,
      alt: "FMCG Personal Care Tubes",
      tag: "Rule 6(1)(b) • Generic Name",
    },
    stackOffset: { x: 20, y: 12 },
    stackRotate: -7,
    target: { x: 30, y: 34, rotate: 0, scale: s(1), w: 16, h: 20 },
    targetSm: { x: 22, y: 40 },
    z: 9,
  },
];

// ---------------------------------------------------------------------------
// Mechanism
// ---------------------------------------------------------------------------

// Scroll progress where the cluster starts scattering and where it finishes.
const SCATTER_START = 0.12;
const SCATTER_END = 0.9;

const PARALLAX_X = 2.6;
const PARALLAX_Y = 2.2;
const PARALLAX_SPRING = { stiffness: 90, damping: 22, mass: 0.6 };
const parallaxDepth = (i: number, total: number) =>
  total <= 1 ? 1 : 0.55 + (i / (total - 1)) * 0.75;

const SUB =
  "Instant AI verification of all 8 statutory packaging declarations, manufacturer caps, and dual-MRP violations in real time.";

const RESPONSIVE = {
  desktop: {
    scale: null as number | null,
    small: false,
    colX: null as number | null,
    card: null as { w: number; h: number } | null,
  },
  small: {
    scale: 0.72,
    small: true,
    colX: 22,
    card: { w: 40, h: 20 },
  },
};

function useResponsive() {
  const [r, setR] = useState(RESPONSIVE.desktop);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const read = () => setR(mq.matches ? RESPONSIVE.small : RESPONSIVE.desktop);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return r;
}

function usePointerParallax(active: boolean, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, PARALLAX_SPRING);
  const y = useSpring(rawY, PARALLAX_SPRING);

  useEffect(() => {
    if (!enabled) return;

    if (!active) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    const onMove = (event: PointerEvent) => {
      rawX.set((event.clientX / window.innerWidth) * 2 - 1);
      rawY.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [active, enabled, rawX, rawY]);

  return { x, y };
}

export interface StackSpreadItem {
  src: string;
  alt?: string;
  tag?: string;
}

export interface StackSpreadTarget {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  w: number;
  h: number;
}

export interface StackSpreadCard {
  item: StackSpreadItem;
  target: StackSpreadTarget;
  /** final x/y (vw/vh) for tablet + mobile; falls back to `target` */
  targetSm?: { x: number; y: number };
  /** angle while clustered */
  stackRotate?: number;
  /** offset while clustered (vw/vh) */
  stackOffset?: { x: number; y: number };
  /** paint order, higher on top */
  z?: number;
}

function Card({
  card,
  progress,
  reduce,
  clusterRotation,
  scaleMul,
  isSmall,
  colX,
  fixedCard,
  stackScale,
  cardRadius,
  pointer,
  depth,
}: {
  card: StackSpreadCard;
  progress: MotionValue<number>;
  reduce: boolean | null;
  clusterRotation: boolean;
  /** uniform rest-scale for every card; null = use each card's own scale */
  scaleMul: number | null;
  isSmall: boolean;
  colX: number | null;
  fixedCard: { w: number; h: number } | null;
  /** scale of the cards while clustered, before the scatter */
  stackScale: number;
  /** corner radius on each card, in px (desktop) */
  cardRadius: number;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  depth: number;
}) {
  const { item, target } = card;

  const flat = reduce === true;
  const stackRotate = flat ? 0 : clusterRotation ? card.stackRotate ?? 0 : 0;
  const stackOffset = card.stackOffset ?? { x: 0, y: 0 };
  const restScale = scaleMul ?? target.scale ?? 1;

  // final resting spot: column grid on small screens, scatter on desktop
  const sm = isSmall && card.targetSm ? card.targetSm : null;
  const endX = sm
    ? colX != null
      ? Math.sign(sm.x) * colX
      : sm.x
    : target.x;
  const endY = sm ? sm.y : target.y;
  const endRotate = flat || isSmall ? 0 : target.rotate;

  // -50% keeps card centred on its anchor
  const translate = useTransform(
    [progress, pointer.x, pointer.y],
    ([p, px, py]: number[]) => {
      const tx = stackOffset.x + (endX - stackOffset.x) * p;
      const ty = stackOffset.y + (endY - stackOffset.y) * p;
      const drift = depth * p;
      const dx = tx - px * PARALLAX_X * drift;
      const dy = ty - py * PARALLAX_Y * drift;
      return `calc(-50% + ${dx}vw) calc(-50% + ${dy}vh)`;
    },
  );
  const rotate = useTransform(progress, [0, 1], [stackRotate, endRotate]);
  const scale = useTransform(progress, [0, 1], [stackScale, restScale]);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 will-change-transform"
      style={{
        width: `${fixedCard ? fixedCard.w : target.w}vw`,
        height: `${fixedCard ? fixedCard.h : target.h}vh`,
        zIndex: card.z ?? 1,
        translate,
        rotate,
        scale,
      }}
    >
      <CardFace item={item} cardRadius={cardRadius} />
    </motion.div>
  );
}

function CardFace({
  item,
  cardRadius,
}: {
  item: StackSpreadItem;
  cardRadius: number;
}) {
  return (
    <div
      className="group relative h-full w-full overflow-hidden shadow-lg border border-black/10 max-md:rounded-[4vw] bg-white/90"
      style={{ borderRadius: `${cardRadius}px` }}
    >
      <img
        src={item.src}
        alt={item.alt ?? ""}
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient vignette for label contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30 pointer-events-none" />

      {/* Forensic scan tag */}
      {item.tag && (
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-white/60 shadow-xs text-[10px] font-mono font-semibold text-ink-900 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          <span>{item.tag}</span>
        </div>
      )}

      {/* Commodity name badge */}
      {item.alt && (
        <div className="absolute bottom-2.5 left-3 right-3 text-[11px] font-semibold text-white truncate drop-shadow-xs pointer-events-none">
          {item.alt}
        </div>
      )}
    </div>
  );
}

interface StackSpreadStageProps {
  cards: StackSpreadCard[];
  /** scatter scroll distance, in vh */
  scrollLength?: number;
  bgColor?: string;
  /** fan the clustered stack (default) or start flat */
  clusterRotation?: boolean;
  /** scale of the cards while clustered, before the scatter */
  stackScale?: number;
  /** corner radius on each card, in px (desktop only — mobile keeps its responsive radius) */
  cardRadius?: number;
  /** color of the centre headline and subtitle */
  textColor?: string;
  /** scroll progress (0-1) where the centre text starts fading in */
  textFadeStart?: number;
  /** show the "scroll to spread" hint at the bottom until the scatter begins */
  showScrollHint?: boolean;
}

function StackSpreadStage({
  cards,
  scrollLength = 350,
  bgColor = "#ececeb",
  clusterRotation = true,
  stackScale = 0.82,
  cardRadius = 8,
  textColor = "#141414",
  textFadeStart = 0.3,
  showScrollHint = true,
}: StackSpreadStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scale: scaleMul, small: isSmall, colX, card: fixedCard } =
    useResponsive();

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  // hold, scatter, then settle
  const progress = useTransform(
    scrollYProgress,
    [0, SCATTER_START, SCATTER_END, 1],
    [0, 0, 1, 1],
  );

  // centre text always fades in on scroll; the scale-in is dropped only when
  // reduced motion is confirmed (`true`), not on the null SSR value.
  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => {
    setSpread((was) => (was ? p > 0.985 : p >= 0.999));
  });
  const parallaxEnabled = reduce !== true && !isSmall;
  const pointer = usePointerParallax(spread, parallaxEnabled);

  const noScale = reduce === true;
  const copyOpacity = useTransform(
    progress,
    [textFadeStart, textFadeStart + 0.35],
    [0, 1],
  );
  const copyScale = useTransform(progress, [textFadeStart, 0.9], [0.85, 1]);

  // scroll hint: visible while clustered, gone by the time the scatter starts
  const hintOpacity = useTransform(progress, [0, SCATTER_START], [1, 0]);

  const isDark =
    bgColor === "#000000" ||
    bgColor.toLowerCase().includes("000") ||
    textColor.toLowerCase() === "#ffffff";

  return (
    <section
      ref={wrapRef}
      className={`relative w-full rounded-canvas shadow-soft ${
        isDark ? "border border-slate-800" : "border border-border"
      }`}
      style={{ height: `${scrollLength}vh`, backgroundColor: bgColor }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden rounded-canvas">
        {/* centre text */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center px-6 text-center max-md:px-8"
          style={{
            opacity: copyOpacity,
            scale: noScale ? 1 : copyScale,
          }}
        >
          {/* Statutory Mandate Chip */}
          <div
            className={`mb-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 shadow-xs backdrop-blur-md ${
              isDark
                ? "border border-slate-700/80 bg-slate-900/80 text-slate-200"
                : "border border-border bg-white/80 text-ink-900"
            }`}
          >
            <Scale
              className={`h-3.5 w-3.5 ${
                isDark ? "text-indigo-400" : "text-tile-indigo-fg"
              }`}
            />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider">
              Legal Metrology Act, 2011
            </span>
          </div>

          <h2
            className="w-full whitespace-pre-line text-[5.2vw] font-bold leading-none! tracking-tight max-md:text-[11vw]"
            style={{ color: textColor }}
          >
            VidhiScan
          </h2>

          {/* Sparkles Glowing Beam Effect from Demo */}
          <div className="relative w-full max-w-[24rem] sm:max-w-[30rem] h-20 sm:h-28 -my-2 sm:-my-3 pointer-events-none">
            {/* Ambient Luminescence Glow */}
            <div className="absolute inset-x-12 top-0 h-8 bg-indigo-500/15 blur-lg rounded-full pointer-events-none" />

            {/* Gradients */}
            <div className="absolute inset-x-8 sm:inset-x-12 top-0 mx-auto h-[2px] w-3/4 bg-gradient-to-r from-transparent via-indigo-600 to-transparent blur-xs" />
            <div className="absolute inset-x-8 sm:inset-x-12 top-0 mx-auto h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-600 to-transparent" />
            <div className="absolute inset-x-16 sm:inset-x-24 top-0 mx-auto h-[4px] w-1/3 bg-gradient-to-r from-transparent via-emerald-500 to-transparent blur-sm" />
            <div className="absolute inset-x-16 sm:inset-x-24 top-0 mx-auto h-px w-1/3 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

            {/* Core Sparkles Component */}
            <SparklesCore
              background="transparent"
              minSize={0.5}
              maxSize={1.5}
              particleDensity={750}
              className="w-full h-full [mask-image:radial-gradient(260px_100px_at_top,white_30%,transparent_90%)]"
              particleColor={isDark ? "#FFFFFF" : "#4338CA"}
              speed={1.8}
            />
          </div>

          <p
            className={`mt-[0.6vw] w-full max-w-[46ch] text-[1.15vw] leading-relaxed tracking-tight max-md:mt-2 max-md:text-[3.5vw] ${
              isDark ? "text-slate-300" : ""
            }`}
            style={{
              color: isDark ? undefined : textColor,
              opacity: isDark ? 0.85 : 0.75,
            }}
          >
            {SUB}
          </p>

          {/* Micro-metrics & Statutory Signals */}
          <div
            className={`mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-mono max-md:hidden ${
              isDark ? "text-slate-400" : "text-ink-500"
            }`}
          >
            <span
              className={`rounded-chip px-2.5 py-1 backdrop-blur-sm shadow-xs ${
                isDark
                  ? "border border-slate-800 bg-slate-900/80 text-slate-300"
                  : "border border-border bg-white/70"
              }`}
            >
              ✓ 8 Mandatory Checks
            </span>
            <span
              className={`rounded-chip px-2.5 py-1 backdrop-blur-sm shadow-xs ${
                isDark
                  ? "border border-slate-800 bg-slate-900/80 text-slate-300"
                  : "border border-border bg-white/70"
              }`}
            >
              ✓ Dual-MRP Shield
            </span>
            <span
              className={`rounded-chip px-2.5 py-1 backdrop-blur-sm shadow-xs ${
                isDark
                  ? "border border-slate-800 bg-slate-900/80 text-slate-300"
                  : "border border-border bg-white/70"
              }`}
            >
              ✓ Section 36 Admissible
            </span>
          </div>
        </motion.div>

        {/* scattering cards */}
        <div className="absolute inset-0 z-10">
          {cards.map((card, i) => (
            <Card
              key={i}
              card={card}
              progress={progress}
              reduce={reduce}
              clusterRotation={clusterRotation}
              scaleMul={scaleMul}
              isSmall={isSmall}
              colX={colX}
              fixedCard={fixedCard}
              stackScale={stackScale}
              cardRadius={cardRadius}
              pointer={pointer}
              depth={parallaxEnabled ? parallaxDepth(i, cards.length) : 0}
            />
          ))}
        </div>

        {/* scroll hint */}
        {showScrollHint && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[3vh] z-20 flex flex-col items-center gap-[0.6vh] text-[0.8vw] font-medium uppercase tracking-[0.2em] max-md:bottom-6 max-md:gap-1 max-md:text-[2.8vw]"
            style={{ color: textColor, opacity: hintOpacity }}
          >
            <span>Scroll</span>
            <ChevronDown
              className="h-4 w-4 animate-bounce max-md:h-[4vw] max-md:w-[4vw]"
              aria-hidden="true"
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}

export interface StackSpreadProps {
  /** scatter scroll distance, in vh */
  scrollLength?: number;
  bgColor?: string;
  /** fan the clustered stack (default) or start flat */
  clusterRotation?: boolean;
  /** scale of the cards while clustered, before the scatter */
  stackScale?: number;
  /** corner radius on each card, in px (desktop only — mobile keeps its responsive radius) */
  cardRadius?: number;
  /** color of the centre headline and subtitle */
  textColor?: string;
  /** scroll progress (0-1) where the centre text starts fading in */
  textFadeStart?: number;
  /** show the "scroll to spread" hint at the bottom until the scatter begins */
  showScrollHint?: boolean;
}

export default function StackSpread({
  scrollLength = 350,
  bgColor = "#ececeb",
  clusterRotation = true,
  stackScale = 0.82,
  cardRadius = 8,
  textColor = "#141414",
  textFadeStart = 0.3,
  showScrollHint = true,
}: StackSpreadProps) {
  return (
    <StackSpreadStage
      cards={CARDS}
      scrollLength={scrollLength}
      bgColor={bgColor}
      clusterRotation={clusterRotation}
      stackScale={stackScale}
      cardRadius={cardRadius}
      textColor={textColor}
      textFadeStart={textFadeStart}
      showScrollHint={showScrollHint}
    />
  );
}
