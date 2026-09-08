import type { ReactNode } from "react";
import MainLayout from "@/shared/ui/MainLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
