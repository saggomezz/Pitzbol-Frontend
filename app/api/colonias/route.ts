import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cp = req.nextUrl.searchParams.get('cp');
  if (!cp || !/^\d{5}$/.test(cp)) {
    return NextResponse.json({ colonias: [] });
  }
  try {
    const res = await fetch(
      `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${cp}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json({ colonias: [] });
    const data = await res.json();
    const colonias: string[] = [
      ...new Set<string>((data.zip_codes || []).map((z: any) => z.d_asenta as string)),
    ].sort();
    return NextResponse.json({ colonias });
  } catch {
    return NextResponse.json({ colonias: [] });
  }
}
