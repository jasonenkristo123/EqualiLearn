"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/shared/hooks/useIsomorphicLayoutEffect";
import { STEPS } from "../data/LandingPageData";

export default function HomeHowItWorks() {
  const rootRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(rootRef);
      const heading = q(".hiw-heading");
      const steps = q(".hiw-step");

      const mm = gsap.matchMedia();

      mm.add(
        {
          isDesktop:
            "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
          isMobile:
            "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
          reduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { isDesktop, reduced } = context.conditions as {
            isDesktop: boolean;
            isMobile: boolean;
            reduced: boolean;
          };

          if (reduced) {
            gsap.set([heading, steps], { autoAlpha: 1, x: 0, y: 0 });
            return;
          }

          gsap.set(heading, { autoAlpha: 0, y: 40 });
          gsap.set(steps, { autoAlpha: 0, x: -40 });

          gsap.to(heading, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top 75%",
              once: true,
            },
          });

          if (isDesktop) {
            const tl = gsap.timeline({
              defaults: { ease: "power2.out" },
              scrollTrigger: {
                trigger: rootRef.current,
                start: "top top",
                end: `+=${steps.length * 520}`,
                pin: true,
                scrub: 1,
                anticipatePin: 1,
              },
            });

            steps.forEach((step, i) => {
              tl.to(step, {
                autoAlpha: 1,
                x: 0,
                duration: 1,
              });
              if (i < steps.length - 1) {
                tl.to({}, { duration: 0.6 });
              }
            });
          } else {
            gsap.to(steps, {
              autoAlpha: 1,
              x: 0,
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.25,
              scrollTrigger: {
                trigger: rootRef.current,
                start: "top 65%",
                once: true,
              },
            });
          }
        },
      );
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="cara-kerja"
      className="w-full overflow-hidden scroll-mt-24 bg-primary-dark px-6 py-20 sm:py-24 md:flex md:min-h-screen md:items-center md:py-0 lg:py-0 3xl:py-0"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-14 sm:gap-16 3xl:gap-20">
        <h2 className="hiw-heading text-center font-serif font-normal leading-tight text-white text-3xl sm:text-4xl lg:text-5xl 3xl:text-6xl">
          Cara Kerja <span className="text-lightblue">EqualiLearn</span>
        </h2>

        <ol className="flex w-full flex-col items-center gap-10 md:flex-row md:items-center md:gap-6 lg:gap-10">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="hiw-step flex w-full max-w-sm items-center gap-4 md:w-auto md:min-w-0 md:max-w-none md:flex-1"
            >
              <Image
                src="/images/panah.svg"
                alt=""
                width={200}
                height={170}
                className="h-auto w-24 shrink-0 sm:w-28 md:w-20 lg:w-24 xl:w-32 3xl:w-40"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-serif text-2xl text-white 3xl:text-3xl">
                  {step.number}
                </span>
                <p className="font-inter-400 text-sm leading-relaxed text-greylight 3xl:text-base">
                  {step.title}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
