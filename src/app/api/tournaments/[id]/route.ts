import { NextRequest, NextResponse } from "next/server";
import { getTournamentState, updateTournamentSettings } from "@/lib/tournament-service";
import { serializeTournament } from "@/lib/view";
import { handleApiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const admin = req.nextUrl.searchParams.get("admin");
    const { tournament, levels, players, prizes } = await getTournamentState(id);
    const isAdmin = !!admin && admin === tournament.adminToken;
    return NextResponse.json(
      serializeTournament({ tournament, levels, players, prizes, isAdmin, origin: req.nextUrl.origin })
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { adminToken, ...patch } = body;
    const { tournament, levels, players, prizes } = await updateTournamentSettings(id, adminToken, patch);
    return NextResponse.json(
      serializeTournament({ tournament, levels, players, prizes, isAdmin: true, origin: req.nextUrl.origin })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
