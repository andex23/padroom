"use client";
import { useRouter } from "next/navigation";
export function Refresh() {
  const router = useRouter();
  return (
    <button className="secondary refresh" onClick={() => router.refresh()}>
      Refresh updates
    </button>
  );
}
