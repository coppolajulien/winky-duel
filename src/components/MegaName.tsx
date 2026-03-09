"use client";

import { useState, useEffect } from "react";
import { resolveMegaName } from "@/lib/megaNames";

interface MegaNameProps {
  address: string;
  fallback: string;
}

/**
 * Displays a .mega domain name if one exists for the address,
 * otherwise falls back to the shortened address.
 */
export function MegaName({ address, fallback }: MegaNameProps) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    resolveMegaName(address).then((n) => {
      if (!cancelled) setName(n);
    });
    return () => { cancelled = true; };
  }, [address]);

  return <>{name ?? fallback}</>;
}
