import { NextResponse } from "next/server";
import { ForbiddenError, NotFoundError, ValidationError } from "./tournament-service";

export function handleApiError(error: unknown) {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: "Ocurrió un error inesperado." }, { status: 500 });
}
