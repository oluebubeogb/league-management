import { NextRequest, NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getOrCreateWallet, listTransactions, mockTopUp } from "@/lib/wallet";
import { z } from "zod";

export async function GET() {
  try {
    const user = await requireUser();
    const wallet = await getOrCreateWallet(user.id);
    const transactions = await listTransactions(user.id, 30);
    return NextResponse.json({ balance: wallet.balance, transactions });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const schema = z.object({
      action: z.literal("mock_topup"),
      amount: z.number().int().min(1).max(10000).optional(),
    });
    const data = schema.parse(body);
    const wallet = await mockTopUp(user.id, data.amount);
    return NextResponse.json({ ok: true, balance: wallet.balance });
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    if (e instanceof Error && e.message.includes("Invalid")) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error("[wallet POST]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
