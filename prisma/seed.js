/**
 * Plain JS seed for production containers (no tsx required).
 * Idempotent — safe to run on every start.
 */
const { PrismaClient } = require("@prisma/client");
let bcrypt;
try {
  bcrypt = require("bcryptjs");
} catch {
  bcrypt = require("/prisma-tools/node_modules/bcryptjs");
}

const prisma = new PrismaClient();

const GROUPS = [
  { code: "A", name: "Group A", displayOrder: 1 },
  { code: "B", name: "Group B", displayOrder: 2 },
  { code: "C", name: "Group C", displayOrder: 3 },
  { code: "D", name: "Group D", displayOrder: 4 },
];

const TEAMS = [
  { name: "Amuzukwu", group: "A", slug: "amuzukwu", shortName: "AMZ" },
  { name: "Umuhu Ajata", group: "A", slug: "umuhu-ajata", shortName: "UAJ" },
  { name: "Ikeaha FC", group: "A", slug: "ikeaha-fc", shortName: "IKE" },
  { name: "Ossah FC", group: "A", slug: "ossah-fc", shortName: "OSS" },
  { name: "Ndume Okpu FC", group: "B", slug: "ndume-okpu-fc", shortName: "NDO" },
  { name: "Umuajiji FC", group: "B", slug: "umuajiji-fc", shortName: "UMJ" },
  { name: "Umuana FC", group: "B", slug: "umuana-fc", shortName: "UMN" },
  { name: "Ugba FC", group: "B", slug: "ugba-fc", shortName: "UGB" },
  { name: "Nkata FC", group: "C", slug: "nkata-fc", shortName: "NKA" },
  { name: "Afaraukwu FC", group: "C", slug: "afaraukwu-fc", shortName: "AFA" },
  { name: "Okwuta FC", group: "C", slug: "okwuta-fc", shortName: "OKW" },
  { name: "Iyienyi FC", group: "C", slug: "iyienyi-fc", shortName: "IYI" },
  { name: "Ajata Okwuru FC", group: "D", slug: "ajata-okwuru-fc", shortName: "AJT" },
  { name: "Amuzuoro FC", group: "D", slug: "amuzuoro-fc", shortName: "AMZ" },
  { name: "Avonkwu FC", group: "D", slug: "avonkwu-fc", shortName: "AVO" },
  { name: "Amatoh FC", group: "D", slug: "amatoh-fc", shortName: "AMT" },
];

const GROUP_FIXTURES = [
  { matchday: 1, date: "2026-10-11", group: "A", home: "amuzukwu", away: "ossah-fc" },
  { matchday: 2, date: "2026-10-15", group: "B", home: "ndume-okpu-fc", away: "umuajiji-fc" },
  { matchday: 3, date: "2026-10-17", group: "C", home: "nkata-fc", away: "afaraukwu-fc" },
  { matchday: 4, date: "2026-10-22", group: "D", home: "ajata-okwuru-fc", away: "amuzuoro-fc" },
  { matchday: 5, date: "2026-10-24", group: "A", home: "umuhu-ajata", away: "ikeaha-fc" },
  { matchday: 6, date: "2026-10-25", group: "B", home: "umuana-fc", away: "ugba-fc" },
  { matchday: 7, date: "2026-10-29", group: "C", home: "okwuta-fc", away: "iyienyi-fc" },
  { matchday: 8, date: "2026-10-31", group: "D", home: "avonkwu-fc", away: "amatoh-fc" },
  { matchday: 9, date: "2026-11-01", group: "A", home: "amuzukwu", away: "umuhu-ajata" },
  { matchday: 10, date: "2026-11-05", group: "B", home: "ndume-okpu-fc", away: "umuana-fc" },
  { matchday: 11, date: "2026-11-07", group: "C", home: "nkata-fc", away: "okwuta-fc" },
  { matchday: 12, date: "2026-11-08", group: "D", home: "ajata-okwuru-fc", away: "avonkwu-fc" },
  { matchday: 13, date: "2026-11-12", group: "A", home: "ikeaha-fc", away: "ossah-fc" },
  { matchday: 14, date: "2026-11-14", group: "B", home: "umuajiji-fc", away: "ugba-fc" },
  { matchday: 15, date: "2026-11-19", group: "C", home: "afaraukwu-fc", away: "iyienyi-fc" },
  { matchday: 16, date: "2026-11-26", group: "D", home: "amuzuoro-fc", away: "amatoh-fc" },
  { matchday: 17, date: "2026-11-28", group: "A", home: "amuzukwu", away: "ikeaha-fc" },
  { matchday: 18, date: "2026-12-03", group: "B", home: "ndume-okpu-fc", away: "ugba-fc" },
  { matchday: 19, date: "2026-12-05", group: "C", home: "nkata-fc", away: "iyienyi-fc" },
  { matchday: 20, date: "2026-12-06", group: "D", home: "ajata-okwuru-fc", away: "amatoh-fc" },
  { matchday: 21, date: "2026-12-10", group: "A", home: "umuhu-ajata", away: "ossah-fc" },
  { matchday: 22, date: "2026-12-12", group: "B", home: "umuajiji-fc", away: "umuana-fc" },
  { matchday: 23, date: "2026-12-13", group: "C", home: "afaraukwu-fc", away: "okwuta-fc" },
  { matchday: 24, date: "2026-12-17", group: "D", home: "amuzuoro-fc", away: "avonkwu-fc" },
];

const KNOCKOUT = [
  { slotCode: "QF1", stage: "QUARTER_FINAL", date: "2026-12-19", homeSlot: "Winner Group A", awaySlot: "Runner-up Group B" },
  { slotCode: "QF2", stage: "QUARTER_FINAL", date: "2026-12-20", homeSlot: "Winner Group B", awaySlot: "Runner-up Group A" },
  { slotCode: "QF3", stage: "QUARTER_FINAL", date: "2026-12-24", homeSlot: "Winner Group C", awaySlot: "Runner-up Group D" },
  { slotCode: "QF4", stage: "QUARTER_FINAL", date: "2026-12-26", homeSlot: "Winner Group D", awaySlot: "Runner-up Group C" },
  { slotCode: "SF1", stage: "SEMI_FINAL", date: "2026-12-27", homeSlot: "Winner QF1", awaySlot: "Winner QF3" },
  { slotCode: "SF2", stage: "SEMI_FINAL", date: "2026-12-31", homeSlot: "Winner QF2", awaySlot: "Winner QF4" },
  { slotCode: "ThirdPlace", stage: "THIRD_PLACE", date: "2027-01-02", homeSlot: "Loser SF1", awaySlot: "Loser SF2" },
  { slotCode: "Final", stage: "FINAL", date: "2027-01-03", homeSlot: "Winner SF1", awaySlot: "Winner SF2" },
];

async function main() {
  console.log("[seed] Seeding League Management…");

  const groupMap = {};
  for (const g of GROUPS) {
    const group = await prisma.group.upsert({
      where: { code: g.code },
      update: { name: g.name, displayOrder: g.displayOrder },
      create: g,
    });
    groupMap[g.code] = group.id;
  }

  const teamMap = {};
  for (const t of TEAMS) {
    const team = await prisma.team.upsert({
      where: { slug: t.slug },
      update: { name: t.name, shortName: t.shortName, groupId: groupMap[t.group] },
      create: {
        name: t.name,
        slug: t.slug,
        shortName: t.shortName,
        groupId: groupMap[t.group],
      },
    });
    teamMap[t.slug] = team.id;
  }

  for (const f of GROUP_FIXTURES) {
    const existing = await prisma.match.findFirst({
      where: {
        stage: "GROUP",
        groupId: groupMap[f.group],
        homeTeamId: teamMap[f.home],
        awayTeamId: teamMap[f.away],
        matchday: f.matchday,
      },
    });
    if (existing) continue;
    await prisma.match.create({
      data: {
        stage: "GROUP",
        groupId: groupMap[f.group],
        homeTeamId: teamMap[f.home],
        awayTeamId: teamMap[f.away],
        kickoffAt: new Date(f.date + "T15:00:00.000Z"),
        status: "SCHEDULED",
        matchday: f.matchday,
        published: true,
      },
    });
  }

  for (const k of KNOCKOUT) {
    const existing = await prisma.match.findFirst({ where: { slotCode: k.slotCode } });
    if (existing) continue;
    await prisma.match.create({
      data: {
        stage: k.stage,
        slotCode: k.slotCode,
        homeSlot: k.homeSlot,
        awaySlot: k.awaySlot,
        kickoffAt: new Date(k.date + "T15:00:00.000Z"),
        status: "SCHEDULED",
        published: true,
      },
    });
  }

  const settings = [
    { key: "competition_name", value: "League Management" },
    {
      key: "sponsor",
      value: "High Chief Dickson Oguguo Nzenwa. Aku Bara-Oha 1 Of Ibeku Ancient Kingdom",
    },
    { key: "qualification_top_n", value: "2" },
    {
      key: "prediction_disclaimer",
      value:
        "Predictions are for entertainment only. No money or prizes are staked or paid through this platform.",
    },
    { key: "timezone", value: "Africa/Lagos" },
  ];
  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // Primary admin — only on first boot
  const username = process.env.PRIMARY_ADMIN_USERNAME;
  const password = process.env.PRIMARY_ADMIN_PASSWORD;
  const phone = process.env.PRIMARY_ADMIN_PHONE;
  if (username && password && phone) {
    const existing = await prisma.user.findFirst({ where: { role: "PRIMARY_ADMIN" } });
    const forceReset = process.env.FORCE_PRIMARY_ADMIN_RESET === "true";
    const passwordHash = await bcrypt.hash(password, 12);
    if (!existing) {
      await prisma.user.create({
        data: {
          username: username.trim(),
          normalizedUsername: username.trim().toLowerCase(),
          phone: phone.trim(),
          normalizedPhone: phone.replace(/\D/g, ""),
          passwordHash,
          role: "PRIMARY_ADMIN",
          status: "ACTIVE",
        },
      });
      console.log("[seed] Primary admin created");
    } else if (forceReset) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: username.trim(),
          normalizedUsername: username.trim().toLowerCase(),
          phone: phone.trim(),
          normalizedPhone: phone.replace(/\D/g, ""),
          passwordHash,
          status: "ACTIVE",
        },
      });
      console.log("[seed] Primary admin password RESET via FORCE_PRIMARY_ADMIN_RESET");
    } else {
      console.log("[seed] Primary admin already exists — password not reset (set FORCE_PRIMARY_ADMIN_RESET=true once to reset)");
    }
  } else {
    console.log("[seed] PRIMARY_ADMIN_* not set — skipping admin bootstrap");
  }

  
  // Align any leftover TBC placeholders (11:00 UTC) on scheduled matches to 16:00 Lagos (15:00 UTC)
  const scheduled = await prisma.match.findMany({
    where: { status: "SCHEDULED" },
  });
  for (const m of scheduled) {
    if (!m.kickoffAt) continue;
    if (m.kickoffAt.getUTCHours() === 11 && m.kickoffAt.getUTCMinutes() === 0) {
      const d = new Date(m.kickoffAt);
      d.setUTCHours(15, 0, 0, 0);
      await prisma.match.update({ where: { id: m.id }, data: { kickoffAt: d } });
    }
  }

  console.log("[seed] Complete.");
}

main()
  .catch((e) => {
    console.error("[seed] Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
