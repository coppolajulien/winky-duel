"use client";

import dynamic from "next/dynamic";

const LeaderboardPage = dynamic(() => import("@/components/LeaderboardPage"), {
  ssr: false,
});

export default function LeaderboardRoute() {
  return <LeaderboardPage />;
}
