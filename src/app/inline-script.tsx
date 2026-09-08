export default function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      // biome-ignore lint/security/noDangerouslySetInnerHtml: The caller supplies a static, developer-authored script.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
