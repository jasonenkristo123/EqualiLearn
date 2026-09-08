import { redirect } from "next/navigation";

type HomePageProps = {
  searchParams: Promise<{
    code?: string | string[];
    state?: string | string[];
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const { code, state } = await searchParams;

  if (typeof code === "string" && typeof state === "string") {
    const callbackParams = new URLSearchParams({ code, state });
    redirect(`/auth/google/callback?${callbackParams.toString()}`);
  }

  redirect("/home");
}
