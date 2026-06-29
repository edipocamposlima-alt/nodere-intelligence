import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        configured: false,
        error: "SUPABASE_PUBLIC_ENV_MISSING"
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      configured: true,
      supabaseUrl,
      supabaseAnonKey
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
