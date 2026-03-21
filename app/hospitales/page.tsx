"use client";

import dynamic from "next/dynamic";

const HospitalesClient = dynamic(() => import("./HospitalesClient"), {
  ssr: false,
});

export default function HospitalesPage() {
  return <HospitalesClient />;
}
