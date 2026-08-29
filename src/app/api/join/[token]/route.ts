import { NextRequest, NextResponse } from "next/server";
import { getAppSettings, getPlayerByToken } from "@/lib/tournament-service";
import { serializeTournament } from "@/lib/view";
import { handleApiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const [{ player, tournament, levels, players, prizes }, appSettings] = await Promise.all([
      getPlayerByToken(token),
      getAppSettings(),
    ]);
    const view = serializeTournament({
      tournament,
      levels,
      players,
      prizes,
      isAdmin: false,
      origin: req.nextUrl.origin,
      appLogoUrl: appSettings?.logoUrl,
    });
    return NextResponse.json({
      ...view,
      me: {
        id: player.id,
        name: player.name,
        status: player.status,
        chipCount: player.chipCount,
        rebuysCount: player.rebuysCount,
        addOnsCount: player.addOnsCount,
        finishPosition: player.finishPosition,
        requestedRebuy: player.requestedRebuy,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
