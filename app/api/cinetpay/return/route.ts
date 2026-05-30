import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL("/admin/plans", request.url);
  url.searchParams.set("payment", "disabled");
  return NextResponse.redirect(url, 303);
}
