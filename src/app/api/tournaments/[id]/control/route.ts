import { NextRequest, NextResponse } from "next/server";
import { controlTournament } from "@/lib/tournament-service";
import { serializeTournament } from "@/lib/view";
import { handleApiError } from "@/lib/api-helpers";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { adminToken, action } = await req.json();
    const { tournament, levels, players, prizes } = await controlTournament(id, adminToken, action);
    return NextResponse.json(
      serializeTournament({ tournament, levels, players, prizes, isAdmin: true, origin: req.nextUrl.origin })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
