import { NextRequest, NextResponse } from "next/server";
import { createTournament } from "@/lib/tournament-service";
import { serializeTournament } from "@/lib/view";
import { handleApiError } from "@/lib/api-helpers";
import { db } from "@/db";
import { blindLevels, players, prizes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tournament = await createTournament(body);

    const [levels, prizeRows] = await Promise.all([
      db.query.blindLevels.findMany({ where: eq(blindLevels.tournamentId, tournament.id) }),
      db.query.prizes.findMany({ where: eq(prizes.tournamentId, tournament.id) }),
    ]);

    const origin = req.nextUrl.origin;
    return NextResponse.json(
      serializeTournament({
        tournament,
        levels,
        players: [],
        prizes: prizeRows,
        isAdmin: true,
        origin,
      }),
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
