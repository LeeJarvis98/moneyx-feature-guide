import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export interface BankInfo {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, bankInfo } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    if (!bankInfo || typeof bankInfo !== "object") {
      return NextResponse.json({ error: "Bank info is required" }, { status: 400 });
    }

    const { bank_name, account_number, account_name } = bankInfo as BankInfo;

    if (
      typeof bank_name !== "string" ||
      typeof account_number !== "string" ||
      typeof account_name !== "string"
    ) {
      return NextResponse.json({ error: "Invalid bank info fields" }, { status: 400 });
    }

    const sanitized: BankInfo = {
      bank_name: bank_name.trim(),
      account_number: account_number.trim(),
      account_name: account_name.trim(),
    };

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("users")
      .update({ bank_info: sanitized })
      .eq("id", userId);

    if (error) {
      console.error("[update-bank-info] Error updating user:", error);
      return NextResponse.json({ error: "Failed to update bank info" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Bank info updated successfully" });
  } catch (error) {
    console.error("[update-bank-info] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
