import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid request", details: error.flatten() }, { status: 400 });
  }
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
