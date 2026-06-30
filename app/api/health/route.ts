import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { featureStatuses, missingCoreEnv } from "@/lib/env";

export async function GET() {
  const missing = missingCoreEnv();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: missing.length ? "degraded" : "ok",
      database: "ok",
      coreEnv: missing.length ? { status: "missing", missing } : { status: "ok", missing: [] },
      features: featureStatuses(),
    }, { status: missing.length ? 503 : 200 });
  } catch {
    return NextResponse.json({
      status: "error",
      database: "error",
      coreEnv: missing.length ? { status: "missing", missing } : { status: "ok", missing: [] },
      features: featureStatuses(),
    }, { status: 503 });
  }
}
