"use client";

import { gsap } from "gsap";
import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export interface LiquidGlassCarouselItem {
  src: string;
  title: string;
  aspect?: number;
}

export interface LiquidGlassCarouselProps {
  items?: LiquidGlassCarouselItem[];
  panelHeight?: number;
  gap?: number;
  background?: string;
  entry?: boolean;
  className?: string;
  style?: CSSProperties;
  onActiveChange?: (index: number) => void;
}

const PORTRAIT_ASPECT = 3 / 4;

export const liquidGlassCarouselDefaultItems: LiquidGlassCarouselItem[] = [
  { title: "Arduino Kit", src: "/arduino_kit.png", aspect: PORTRAIT_ASPECT },
  { title: "IoT Sensors", src: "/sensors_collection.png", aspect: PORTRAIT_ASPECT },
  { title: "Engineering Books", src: "/textbooks_stack.png", aspect: PORTRAIT_ASPECT },
  { title: "Video Courses", src: "/video_course.png", aspect: PORTRAIT_ASPECT },
  { title: "Lab Equipment", src: "/lab_equipment.png", aspect: PORTRAIT_ASPECT },
  { title: "Study Notes", src: "/notes_pdf.png", aspect: PORTRAIT_ASPECT },
  { title: "Raspberry Pi", src: "/raspberry_pi.png", aspect: PORTRAIT_ASPECT },
  { title: "Mentorship", src: "/mentorship.png", aspect: PORTRAIT_ASPECT },
];

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Liquid Glass Carousel with rise-align-zoom animation sequence */
export function LiquidGlassCarousel({
  items = liquidGlassCarouselDefaultItems,
  panelHeight = 450,
  background = "#ffffff",
  entry = true,
  className,
  style,
  onActiveChange,
}: LiquidGlassCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [, setAnimationComplete] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Entry animation: rise from bottom → align → zoom
  useEffect(() => {
    if (!entry || !rowRef.current || prefersReducedMotion()) {
      setAnimationComplete(true);
      return;
    }

    const row = rowRef.current;
    const panels = Array.from(row.querySelectorAll("[data-panel]"));

    // Set initial state: scattered at bottom
    gsap.set(panels, {
      y: () => gsap.utils.random(200, 400),
      x: () => gsap.utils.random(-100, 100),
      opacity: 0,
      scale: 0.6,
      rotation: () => gsap.utils.random(-15, 15),
    });

    // Timeline for the animation sequence
    const tl = gsap.timeline({
      onComplete: () => setAnimationComplete(true),
    });

    // Phase 1: Rise and align to horizontal line
    tl.to(panels, {
      y: 0,
      x: 0,
      opacity: 1,
      rotation: 0,
      duration: 1.2,
      stagger: 0.08,
      ease: "power3.out",
    });

    // Phase 2: Scale up to normal size
    tl.to(
      panels,
      {
        scale: 1,
        duration: 0.8,
        stagger: 0.05,
        ease: "back.out(1.4)",
      },
      "-=0.6"
    );

    return () => {
      tl.kill();
    };
  }, [entry]);

  // Handle active item change
  useEffect(() => {
    if (onActiveChange) {
      onActiveChange(active);
    }
  }, [active, onActiveChange]);

  // Scroll to active item
  const scrollToItem = (index: number) => {
    if (!rowRef.current) return;
    const panels = Array.from(rowRef.current.querySelectorAll("[data-panel]"));
    const panel = panels[index] as HTMLElement;
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  const handlePrev = () => {
    const newIndex = active === 0 ? items.length - 1 : active - 1;
    setActive(newIndex);
    scrollToItem(newIndex);
  };

  const handleNext = () => {
    const newIndex = active === items.length - 1 ? 0 : active + 1;
    setActive(newIndex);
    scrollToItem(newIndex);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full overflow-hidden", className)}
      style={{ background, minHeight: `${panelHeight}px`, ...style }}
    >
      {/* Horizontal scrolling row */}
      <div
        ref={rowRef}
        className="flex items-center justify-start gap-4 px-8 py-12 h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            data-panel
            className="flex-shrink-0 snap-center cursor-pointer transition-all duration-500"
            style={{
              width: `${panelHeight * (item.aspect || PORTRAIT_ASPECT)}px`,
              height: `${panelHeight}px`,
              transform:
                hoveredIndex === idx
                  ? "scale(1.08) translateY(-8px)"
                  : active === idx
                  ? "scale(1.05)"
                  : "scale(0.92)",
              opacity: active === idx ? 1 : hoveredIndex === idx ? 0.95 : 0.7,
              filter:
                active === idx
                  ? "brightness(1.1) saturate(1.2)"
                  : hoveredIndex === idx
                  ? "brightness(1.05)"
                  : "brightness(0.85) saturate(0.8)",
            }}
            onClick={() => {
              setActive(idx);
              scrollToItem(idx);
            }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <img
              src={item.src}
              alt={item.title}
              className="w-full h-full object-cover rounded-2xl shadow-2xl"
              style={{
                border:
                  active === idx
                    ? "3px solid rgba(255, 107, 26, 0.8)"
                    : hoveredIndex === idx
                    ? "2px solid rgba(255, 107, 26, 0.5)"
                    : "1px solid rgba(0, 0, 0, 0.1)",
                boxShadow:
                  active === idx
                    ? "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 107, 26, 0.3)"
                    : hoveredIndex === idx
                    ? "0 15px 40px rgba(0, 0, 0, 0.3)"
                    : "0 10px 30px rgba(0, 0, 0, 0.2)",
              }}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110"
        style={{
          border: "2px solid rgba(0, 0, 0, 0.1)",
        }}
        aria-label="Previous"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110"
        style={{
          border: "2px solid rgba(0, 0, 0, 0.1)",
        }}
        aria-label="Next"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Title Display */}
      <div className="absolute left-1/2 top-6 -translate-x-1/2 z-10">
        <p
          className="text-center text-lg font-semibold tracking-tight px-6 py-2 rounded-full backdrop-blur-md"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            border: "2px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          {items[active]?.title}
        </p>
      </div>

      {/* Counter Display */}
      <div className="absolute left-1/2 bottom-6 -translate-x-1/2 z-10">
        <p
          className="text-center text-sm font-mono tabular-nums px-5 py-2 rounded-full backdrop-blur-md"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            border: "2px solid rgba(0, 0, 0, 0.1)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          {pad(active + 1)} / {pad(items.length)}
        </p>
      </div>

      {/* Hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
