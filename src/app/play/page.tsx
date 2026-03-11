"use client";

import dynamic from "next/dynamic";
import { InviteGate } from "@/components/InviteGate";

const GamePage = dynamic(() => import("@/components/GamePage"), {
  ssr: false,
});

export default function Play() {
  return (
    <InviteGate>
      <GamePage />
    </InviteGate>
  );
}
