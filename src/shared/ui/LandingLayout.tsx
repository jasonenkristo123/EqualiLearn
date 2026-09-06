import type { ReactNode } from "react";
import Footer from "@/shared/ui/footer";
import Navbar from "@/shared/ui/Navbar";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-primary-dark">
      {/* Fixed navbar overlays the section below it */}
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
