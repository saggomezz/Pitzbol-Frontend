import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const AUTHORIZED_EMAIL = "cua@hotmail.com";
const CSV_PATH = path.join(process.cwd(), "public", "datosLugares.csv");

export async function POST(req: NextRequest) {
  try {
    const { nombre, token } = await req.json();
    if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    // Verify admin via backend
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.pitzbol.me:8443";
    const meRes = await fetch(`${backendUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);

    if (!meRes || !meRes.ok) return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    const meData = await meRes.json().catch(() => null);
    if (meData?.email !== AUTHORIZED_EMAIL) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    // Remove from CSV
    if (fs.existsSync(CSV_PATH)) {
      const content = fs.readFileSync(CSV_PATH, "utf8");
      const lines = content.split("\n");
      const filtered = lines.filter(line => {
        const cell = line.startsWith('"') ? line.slice(1, line.indexOf('",')) : line.split(",")[0];
        return !cell.toLowerCase().includes(nombre.toLowerCase().split(",")[0].trim().toLowerCase());
      });
      if (filtered.length < lines.length) {
        fs.writeFileSync(CSV_PATH, filtered.join("\n"), "utf8");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
