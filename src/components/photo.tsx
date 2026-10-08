"use client";
/* eslint-disable @next/next/no-img-element -- Photos are resized server-side. Native images keep short-lived private URLs out of the Next image optimizer/cache and its development diagnostics. */
import { useState } from "react";
export function Photo({
  src,
  alt,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <p className="meta" role="status">
      Photo unavailable. Refresh the page to retry.
    </p>
  ) : (
    <img
      src={src}
      alt={alt}
      width={1600}
      height={1600}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
