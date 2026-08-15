import { NextRequest, NextResponse } from "next/server";
import { requestRebuy } from "@/lib/tournament-service";
import { handleApiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ token: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    await requestRebuy(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
