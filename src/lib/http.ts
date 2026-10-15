import { NextResponse } from "next/server";

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export const jsonHeaders = { "Cache-Control": "no-store" };

export function isSafeRedirect(value: string, baseUrl: string): string | null {
  try {
    const target = new URL(value, baseUrl);
    const base = new URL(baseUrl);
    return target.origin === base.origin ? `${target.pathname}${target.search}${target.hash}` : null;
  } catch {
    return null;
  }
}
