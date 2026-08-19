import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function rejectCrossOriginMutation(request: NextRequest) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return null;

  const expectedOrigin = request.nextUrl.origin;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== expectedOrigin) || (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")) {
    return NextResponse.json({ message: "Origem da requisição não autorizada." }, { status: 403 });
  }
  return null;
}
