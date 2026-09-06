import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HomeHero() {
    return (
        <section className="relative w-full h-dvh overflow-clip">
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
                    Ruang belajar di mana <span className="italic">pengetahuan</span> melampaui batas sensorik.
                </h1>
                <Button
                    size="lg"
                    className="flex cursor-pointer items-center rounded-xl bg-linear-white gap-2 px-6 py-4 text-sm sm:gap-4 sm:px-8 sm:py-6 sm:text-base"
                >
                    Mulai Belajar <ArrowRight className="size-4 sm:size-5" />
                </Button>
            </div>
        </section>
    );
}
