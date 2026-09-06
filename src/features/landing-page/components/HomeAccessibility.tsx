"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function HomeAccessibility() {
  const rootRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(rootRef);
      const heading = q(".ha-heading");
      const button = q(".ha-button");
      const lights = q(".ha-light");
      const blueLight = q(".ha-light-blue");
      const purpleLight = q(".ha-light-purple");

      gsap.set(heading, { autoAlpha: 0, y: 40 });
      gsap.set(button, { autoAlpha: 0, y: 20 });
      gsap.set(lights, {
        autoAlpha: 0,
        scale: 0.55,
        filter: "blur(24px)",
      });
      gsap.set(blueLight, { transformOrigin: "top left" });
      gsap.set(purpleLight, { transformOrigin: "top right" });

      const mm = gsap.matchMedia();

      mm.add(
        {
          reduced: "(prefers-reduced-motion: reduce)",
          normal: "(prefers-reduced-motion: no-preference)",
        },
        (context) => {
          if (context.conditions?.reduced) {
            gsap.set([heading, button, lights], {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              filter: "none",
            });
            return;
          }

          const tl = gsap.timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 70%",
              once: true,
            },
          });

          tl.to(heading, { autoAlpha: 1, y: 0, duration: 0.9 })
            .to(
              lights,
              {
                autoAlpha: 1,
                scale: 1,
                filter: "blur(0px)",
                duration: 1.5,
                ease: "power2.out",
                stagger: 0.18,
              },
              "-=0.25",
            )
            .to(button, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.7");
        },
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="aksesibilitas"
      className="relative w-full scroll-mt-24 overflow-x-clip bg-primary-dark"
    >
      <Image
        src="/images/blue-light.svg"
        alt=""
        aria-hidden
        width={900}
        height={900}
        className="ha-light ha-light-blue pointer-events-none absolute -left-20 sm:left-0 sm:-top-20 h-auto w-[90%] max-w-none select-none [mask-image:linear-gradient(to_bottom,transparent,#000_25%)] sm:w-[60%] lg:w-[55%]"
      />
      <Image
        src="/images/purle-light.svg"
        alt=""
        aria-hidden
        width={700}
        height={900}
        className="ha-light ha-light-purple pointer-events-none absolute -right-20 sm:right-0 sm:-top-20 h-auto w-[90%] max-w-none select-none [mask-image:linear-gradient(to_bottom,transparent,#000_25%)] sm:w-[60%] lg:w-[55%]"
      />

      <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-4xl flex-col items-center justify-center gap-10 px-6 py-32 text-center sm:gap-12 sm:py-40 lg:py-48">
        <h2 className="ha-heading font-serif font-normal leading-tight text-white text-4xl sm:text-5xl lg:text-6xl 3xl:text-7xl">
          Mulai perjalanan{" "}
          <span className="italic text-lightblue">inklusif</span> Anda.
        </h2>

        <Link
          href="/login"
          className="ha-button inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-inter-600 text-xs uppercase tracking-wider text-primary-dark transition-colors hover:bg-white/90"
        >
          Mulai Sekarang
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
