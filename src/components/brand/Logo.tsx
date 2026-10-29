import Image from "next/image";

/**
 * Official NEXT logo components. These render the supplied original raster files
 * unmodified (aspect ratio locked, tagline never hidden in the "full" variant).
 * TODO(brand): replace with the approved SVG/high-res source when provided.
 */
const FULL = { src: "/brand/next-logo-full.png", w: 2167, h: 726 };
const MARK = { src: "/brand/next-mark.png", w: 1254, h: 1254 };

export function LogoFull({ height = 44, priority = false }: { height?: number; priority?: boolean }) {
  return (
    <Image
      src={FULL.src}
      alt="NEXT | HR & Recruitment — Your next step starts here"
      width={Math.round((FULL.w / FULL.h) * height)}
      height={height}
      priority={priority}
      style={{ height, width: "auto" }}
    />
  );
}

/** Compact mark for small spaces (favicon-size, app icons, mobile header). */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <Image
      src={MARK.src}
      alt="NEXT"
      width={size}
      height={size}
      style={{ height: size, width: size }}
    />
  );
}
