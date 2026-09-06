import Image from "next/image";
import { STEPS } from "../data/LandingPageData";

export default function HomeHowItWorks() {
  return (
    <section
      id="cara-kerja"
      className="w-full overflow-hidden scroll-mt-24 bg-primary-dark px-6 py-20 sm:py-24 lg:py-32 3xl:py-40"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-14 sm:gap-16 3xl:gap-20">
        <h2 className="text-center font-serif font-normal leading-tight text-white text-3xl sm:text-4xl lg:text-5xl 3xl:text-6xl">
          Cara Kerja <span className="text-lightblue">EqualiLearn</span>
        </h2>

        <ol className="flex w-full flex-col items-center gap-10 md:flex-row md:items-center md:gap-6 lg:gap-10">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="flex w-full max-w-sm items-center gap-4 md:w-auto md:min-w-0 md:max-w-none md:flex-1"
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
