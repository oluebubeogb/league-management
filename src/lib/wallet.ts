import { prisma } from "./db";
import type { TransactionType } from "@prisma/client";

export const STARTER_BALANCE = 1000;
export const MOCK_TOPUP_AMOUNT = 500;

/** Get or create wallet; awards starter coins on first creation. */
export async function getOrCreateWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (wallet) return wallet;

  wallet = await prisma.wallet.create({
    data: { userId, balance: STARTER_BALANCE },
  });
  await prisma.transaction.create({
    data: {
      userId,
      amount: STARTER_BALANCE,
      type: "STARTER",
      note: "Welcome bonus",
    },
  });
  return wallet;
}

export async function getBalance(userId: string): Promise<number> {
  const w = await getOrCreateWallet(userId);
  return w.balance;
}

/** Atomic credit/debit. Throws if debit would go negative. */
export async function adjustBalance(
  userId: string,
  amount: number,
  type: TransactionType,
  opts?: { referenceId?: string; note?: string }
) {
  await getOrCreateWallet(userId);

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId } });
    const next = wallet.balance + amount;
    if (next < 0) {
      throw new Error("Insufficient coins");
    }
    const updated = await tx.wallet.update({
      where: { userId },
      data: { balance: next },
    });
    await tx.transaction.create({
      data: {
        userId,
        amount,
        type,
        referenceId: opts?.referenceId ?? null,
        note: opts?.note ?? null,
      },
    });
    return updated;
  });
}

export async function mockTopUp(userId: string, amount = MOCK_TOPUP_AMOUNT) {
  if (amount <= 0 || amount > 10000) throw new Error("Invalid top-up amount");
  return adjustBalance(userId, amount, "MOCK_DEPOSIT", {
    note: `Mock top-up +${amount}`,
  });
}

export async function listTransactions(userId: string, take = 50) {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
