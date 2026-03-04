"use client";

import dynamic from "next/dynamic";

const AdminPage = dynamic(() => import("@/components/AdminPage"), {
  ssr: false,
});

export default function Admin() {
  return <AdminPage />;
}
