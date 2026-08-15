import { NextRequest, NextResponse } from "next/server";
import { getTournamentState, removePlayer, updatePlayer } from "@/lib/tournament-service";
import { serializeTournament } from "@/lib/view";
import { handleApiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string; playerId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id, playerId } = await params;
    const { adminToken, ...patch } = await req.json();
    await updatePlayer(id, playerId, adminToken, patch);
    const { tournament, levels, players, prizes } = await getTournamentState(id);
    return NextResponse.json(
      serializeTournament({ tournament, levels, players, prizes, isAdmin: true, origin: req.nextUrl.origin })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id, playerId } = await params;
    const adminToken = req.nextUrl.searchParams.get("adminToken");
    await removePlayer(id, playerId, adminToken ?? "");
    const { tournament, levels, players, prizes } = await getTournamentState(id);
    return NextResponse.json(
      serializeTournament({ tournament, levels, players, prizes, isAdmin: true, origin: req.nextUrl.origin })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
