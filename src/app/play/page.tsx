"use client";

import dynamic from "next/dynamic";

const GamePage = dynamic(() => import("@/components/GamePage"), {
  ssr: false,
});

export default function Play() {
  return <GamePage />;
}
