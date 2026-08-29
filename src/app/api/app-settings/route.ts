import { NextRequest, NextResponse } from "next/server";
import { getAppSettings, updateAppLogo } from "@/lib/tournament-service";
import { handleApiError } from "@/lib/api-helpers";

// App-wide settings (currently just the shared logo shown on every
// tournament's public/player screens, alongside each tournament's own logo).
// Editable from the Home page — see updateAppLogo for why this has no token.
export async function GET() {
  try {
    const settings = await getAppSettings();
    return NextResponse.json({ logoUrl: settings?.logoUrl ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { logoUrl } = await req.json();
    const settings = await updateAppLogo(logoUrl ?? null);
    return NextResponse.json({ logoUrl: settings?.logoUrl ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
