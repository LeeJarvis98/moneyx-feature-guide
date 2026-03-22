import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .select("bank_info")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[get-bank-info] Error fetching user:", error);
      return NextResponse.json({ error: "Failed to fetch bank info" }, { status: 500 });
    }

    return NextResponse.json({ bankInfo: data?.bank_info ?? null });
  } catch (error) {
    console.error("[get-bank-info] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
