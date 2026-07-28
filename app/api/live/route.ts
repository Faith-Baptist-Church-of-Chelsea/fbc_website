// Tells the live banner what to show. Called by the browser at most once
// per page view, and only does real YouTube work during service windows —
// outside them it answers instantly without touching any API.
import { NextResponse } from "next/server";
import { currentServiceWindow } from "@/lib/service-windows";
import { checkLiveNow } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  const window = currentServiceWindow();
  if (!window) {
    return NextResponse.json({ show: false });
  }
  // In a service window. Verify with YouTube when possible so we never
  // falsely claim "live"; without a key we say "happening now" instead.
  const { live, videoId } = await checkLiveNow();
  if (live === false) {
    // API answered definitively: not live (stream not started / ended early).
    return NextResponse.json({ show: false });
  }
  return NextResponse.json({
    show: true,
    verified: live === true,
    label: window.label,
    videoId,
  });
}
