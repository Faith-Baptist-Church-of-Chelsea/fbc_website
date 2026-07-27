import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

// Renders a photo if the file exists in public/, otherwise a clearly
// labeled placeholder showing exactly which file to drop in. When Steven
// adds the file (public/images/...), the placeholder becomes the photo on
// the next build — no code change needed. Server component only (uses fs).
export default function Photo({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const exists = fs.existsSync(path.join(process.cwd(), "public", src));

  if (!exists) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 ${className}`}
        style={{ aspectRatio: `${width} / ${height}` }}
        role="img"
        aria-label={alt}
      >
        <div className="p-4 text-center text-slate-500">
          <p className="text-sm font-semibold">Photo coming soon</p>
          <p className="mt-1 font-mono text-xs">{src}</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`rounded-xl object-cover ${className}`}
      priority={priority}
      sizes={sizes}
    />
  );
}
