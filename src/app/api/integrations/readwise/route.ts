import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/firebase/session";
import { clearReadwiseToken, setReadwiseToken } from "@/lib/db/server";

export const dynamic = "force-dynamic";

const RW_BASE = "https://readwise.io/api/v3";

/** Validate a Readwise token and store it in the server-only integrations doc. */
export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let token: string | undefined;
  try {
    ({ token } = await request.json());
  } catch {
    return NextResponse.json({ error: "Malformed body" }, { status: 400 });
  }

  const trimmed = token?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Missing Readwise token" }, { status: 400 });
  }

  // Prove the token works before persisting it.
  try {
    const res = await fetch(`${RW_BASE}/list/?location=later&withHtmlContent=false`, {
      headers: { Authorization: `Token ${trimmed}` },
    });

    if (res.status === 401) {
      return NextResponse.json(
        { error: "Invalid Readwise token. Check your access token at readwise.io/access_token" },
        { status: 401 }
      );
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Readwise returned ${res.status}` }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Could not reach Readwise" }, { status: 502 });
  }

  await setReadwiseToken(user.uid, trimmed);
  return NextResponse.json({ connected: true });
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await clearReadwiseToken(user.uid);
  return NextResponse.json({ connected: false });
}
