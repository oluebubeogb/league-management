/**
 * Compiled-style seed for Docker entrypoint (CommonJS).
 * Mirrors prisma/seed.ts — platform admin + optional demo league only.
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const username = process.env.PRIMARY_ADMIN_USERNAME || "admin";
  const password = process.env.PRIMARY_ADMIN_PASSWORD || "changeme";
  const phone = process.env.PRIMARY_ADMIN_PHONE || "2348000000000";
  const forceReset = process.env.FORCE_PRIMARY_ADMIN_RESET === "true";

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedPhone = phone.replace(/\D/g, "");
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: { normalizedUsername },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        username,
        normalizedUsername,
        phone,
        normalizedPhone,
        passwordHash,
        role: "PRIMARY_ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`[seed] Created PRIMARY_ADMIN: ${username}`);
  } else if (forceReset) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash,
        phone,
        normalizedPhone,
        role: "PRIMARY_ADMIN",
        status: "ACTIVE",
      },
    });
    console.log(`[seed] Reset PRIMARY_ADMIN password: ${username}`);
  } else {
    console.log(`[seed] PRIMARY_ADMIN already exists: ${username} (skip)`);
  }

  const demoSlug = "demo-league";
  const admin = await prisma.user.findUnique({ where: { normalizedUsername } });
  if (admin) {
    const demo = await prisma.league.findUnique({ where: { slug: demoSlug } });
    if (!demo) {
      const league = await prisma.league.create({
        data: {
          name: "Demo League",
          slug: demoSlug,
          description: "Sample league created by seed. Safe to delete.",
          visibility: "PUBLIC",
          status: "ACTIVE",
          inviteCode: "DEMO2026",
          createdById: admin.id,
          members: {
            create: { userId: admin.id, role: "OWNER", status: "ACTIVE" },
          },
        },
      });
      console.log(`[seed] Created demo league: ${league.slug}`);
    } else {
      console.log(`[seed] Demo league already exists (skip)`);
    }
  }

  console.log("[seed] Done");
}

main()
  .catch((e) => {
    console.error("[seed] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
