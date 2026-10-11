import Image from "next/image";

export type AiArtKind = "mascot" | "workflow" | "attendance" | "network";

/** These local images live in EDUSPHERE-NEW/public/ai, with no external image host. */
const art: Record<AiArtKind, { src: string; alt: string }> = {
  mascot: {
    src: "/ai/edusphere-mascot.webp",
    alt: "Friendly EduSphere AI learning assistant surrounded by chat and education tools",
  },
  workflow: {
    src: "/ai/edusphere-workflow.webp",
    alt: "EduSphere assistant coordinating teacher schedules and school operations",
  },
  attendance: {
    src: "/ai/edusphere-attendance.webp",
    alt: "EduSphere AI assistant reviewing attendance and class insights",
  },
  network: {
    src: "/ai/edusphere-network.webp",
    alt: "Connected school workflows organized around an intelligent assistant",
  },
};

export function AiArt({
  kind,
  className = "",
  sizes = "(max-width: 640px) 160px, 280px",
  priority = false,
  decorative = false,
}: {
  kind: AiArtKind;
  className?: string;
  sizes?: string;
  priority?: boolean;
  decorative?: boolean;
}) {
  return (
    <Image
      src={art[kind].src}
      alt={decorative ? "" : art[kind].alt}
      aria-hidden={decorative || undefined}
      width={580}
      height={580}
      sizes={sizes}
      priority={priority}
      draggable={false}
      className={`h-auto w-full select-none object-contain ${className}`}
    />
  );
}
