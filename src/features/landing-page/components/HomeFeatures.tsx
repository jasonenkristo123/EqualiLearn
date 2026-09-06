import Image from "next/image";
import { BADGEDATA, PILLARS } from "../data/LandingPageData";

function BadgeRow({ "aria-hidden": ariaHidden }: { "aria-hidden"?: boolean }) {
    return (
        <ul
            aria-hidden={ariaHidden}
            className="flex shrink-0 items-center gap-8 pr-8"
        >
            {BADGEDATA.map((badge, i) => (
                <li
                    key={`${badge.desc}-${i}`}
                    className="flex items-center gap-8 whitespace-nowrap"
                >
                    <span className="font-inter-600 text-xl text-white">
                        {badge.desc}
                    </span>
                    <Image
                        src="/images/star.svg"
                        alt=""
                        width={24}
                        height={24}
                    />
                </li>
            ))}
        </ul>
    );
}

export default function HomeFeatures() {
    return (
        <section id="fitur" className="w-full scroll-mt-24 bg-primary-dark">
            <div className="flex overflow-x-hidden select-none border border-white/10 py-6">
                <div className="flex w-max animate-marquee hover:paused">
                    <BadgeRow aria-hidden />
                </div>
            </div>
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 sm:gap-16 3xl:gap-20 px-6 py-20 sm:py-24 lg:py-32 3xl:py-40 ">
                <h2 className="text-center font-serif font-normal leading-tight text-white text-3xl sm:text-4xl lg:text-5xl 3xl:text-6xl">
                    Empat Pilar <span className="italic text-lightblue">Akses</span>
                </h2>

                <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 sm:gap-6 3xl:gap-8">
                    {PILLARS.map((pillar) => (
                        <article
                            key={pillar.title}
                            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-lightwhite p-6 sm:p-8 3xl:p-10"
                        >
                            <Image src={pillar.icon} alt={pillar.title} width={24} height={20}/>
                            <h3 className="font-serif font-normal text-white text-xl sm:text-2xl 3xl:text-3xl">
                                {pillar.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-white/60 sm:text-base 3xl:text-lg">
                                {pillar.description}
                            </p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
