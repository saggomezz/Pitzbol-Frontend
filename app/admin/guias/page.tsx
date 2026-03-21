"use client";

import dynamic from "next/dynamic";

const AdminGuiasClient = dynamic(() => import("./AdminGuiasClient"), {
  ssr: false,
});

export default function AdminGuiasPage() {
  return <AdminGuiasClient />;
}
