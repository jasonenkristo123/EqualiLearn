import type { ReactNode } from "react";
import LandingLayout from "@/shared/ui/LandingLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <LandingLayout>{children}</LandingLayout>;
}
