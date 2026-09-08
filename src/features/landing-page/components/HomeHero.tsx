"use client";

import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { Fragment, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useIsomorphicLayoutEffect } from "@/shared/hooks/useIsomorphicLayoutEffect";
import { HERO_HEADING_WORDS } from "../data/LandingPageData";

export default function HomeHero() {
  const rootRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(rootRef);
      const words = q(".hero-word");
      const cta = q(".hero-cta");

      const mm = gsap.matchMedia();

      mm.add(
        {
          animate: "(prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          if (context.conditions?.reduced) {
            gsap.set([words, cta], {
              autoAlpha: 1,
              y: 0,
              filter: "none",
            });
            return;
          }

          gsap.set(words, {
            autoAlpha: 0,
            y: 24,
            filter: "blur(6px)",
          });
          gsap.set(cta, { autoAlpha: 0, y: 20 });

          const tl = gsap.timeline({
            defaults: { ease: "power2.out" },
          });

          // Headline "writes" in, word by word.
          tl.to(words, {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.6,
            stagger: 0.07,
          }).to(cta, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.1");
        },
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="beranda"
      ref={rootRef}
      className="relative w-full h-dvh overflow-clip"
    >
      <video
        src="/video/hero-video.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col items-center px-6 pt-40 gap-8 text-center sm:pt-32 sm:gap-10 lg:pt-40 lg:gap-12 3xl:pt-46.25 3xl:gap-15">
        <h1 className="w-full font-serif font-normal leading-tight text-white text-4xl max-w-[90%] sm:text-5xl sm:max-w-[80%] lg:text-6xl lg:max-w-[75%] 3xl:text-7xl 3xl:max-w-[70%]">
          {HERO_HEADING_WORDS.map((word, i) => (
            <Fragment key={`${word.text}-${i}`}>
              <span
                className={
                  word.italic
                    ? "hero-word inline-block italic"
                    : "hero-word inline-block"
                }
              >
                {word.text}
              </span>
              {i < HERO_HEADING_WORDS.length - 1 ? " " : ""}
            </Fragment>
          ))}
        </h1>
        <Button
          size="lg"
          className="hero-cta flex cursor-pointer items-center rounded-xl bg-linear-white gap-2 px-6 py-4 text-sm sm:gap-4 sm:px-8 sm:py-6 sm:text-base"
        >
          Mulai Belajar <ArrowRight className="size-4 sm:size-5" />
        </Button>
      </div>
    </section>
  );
}
