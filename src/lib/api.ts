import { NextResponse } from "next/server";

// Hardcoded org ID for now (single-tenant MVP)
export const DEFAULT_ORG_ID = "default-org";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
