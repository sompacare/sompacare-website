"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

export const CAREERS_APPLY_EVENT = "sompacare:careers-apply";

export function scrollToCareersApply(positionId: string) {
  window.dispatchEvent(
    new CustomEvent(CAREERS_APPLY_EVENT, { detail: { positionId } }),
  );

  const anchor = document.getElementById(`apply-${positionId}`);
  const section = document.getElementById("apply");
  (anchor ?? section)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type ApplyNowButtonProps = {
  positionId: string;
  className?: string;
  children: ReactNode;
};

export function ApplyNowButton({ positionId, className, children }: ApplyNowButtonProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hash = `apply-${positionId}`;

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    if (pathname === "/careers") {
      window.history.replaceState(null, "", `#${hash}`);
      scrollToCareersApply(positionId);
      return;
    }

    router.push(`/careers#${hash}`);
  }

  return (
    <a href={`/careers#${hash}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
