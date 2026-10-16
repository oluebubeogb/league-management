import { PrismaClient, MatchStage, MatchStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const GROUPS = [
  { code: "A", name: "Group A", displayOrder: 1 },
  { code: "B", name: "Group B", displayOrder: 2 },
  { code: "C", name: "Group C", displayOrder: 3 },
  { code: "D", name: "Group D", displayOrder: 4 },
];

const TEAMS: { name: string; group: string; slug: string; shortName: string }[] = [
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

/** Group-stage fixtures exactly as specified (dates in Africa/Lagos, no times). */
const GROUP_FIXTURES: {
  matchday: number;
  date: string; // YYYY-MM-DD
  group: string;
  home: string;
  away: string;
}[] = [
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

/** Knockout slots — opponents resolved dynamically from group standings / previous results. */
const KNOCKOUT: {
  slotCode: string;
  stage: MatchStage;
  date: string;
  homeSlot: string;
  awaySlot: string;
}[] = [
  { slotCode: "QF1", stage: MatchStage.QUARTER_FINAL, date: "2026-12-19", homeSlot: "Winner Group A", awaySlot: "Runner-up Group B" },
  { slotCode: "QF2", stage: MatchStage.QUARTER_FINAL, date: "2026-12-20", homeSlot: "Winner Group B", awaySlot: "Runner-up Group A" },
  { slotCode: "QF3", stage: MatchStage.QUARTER_FINAL, date: "2026-12-24", homeSlot: "Winner Group C", awaySlot: "Runner-up Group D" },
  { slotCode: "QF4", stage: MatchStage.QUARTER_FINAL, date: "2026-12-26", homeSlot: "Winner Group D", awaySlot: "Runner-up Group C" },
  { slotCode: "SF1", stage: MatchStage.SEMI_FINAL, date: "2026-12-27", homeSlot: "Winner QF1", awaySlot: "Winner QF3" },
  { slotCode: "SF2", stage: MatchStage.SEMI_FINAL, date: "2026-12-31", homeSlot: "Winner QF2", awaySlot: "Winner QF4" },
  { slotCode: "ThirdPlace", stage: MatchStage.THIRD_PLACE, date: "2027-01-02", homeSlot: "Loser SF1", awaySlot: "Loser SF2" },
  { slotCode: "Final", stage: MatchStage.FINAL, date: "2027-01-03", homeSlot: "Winner SF1", awaySlot: "Winner SF2" },
];

async function seedGroupsAndTeams() {
  const groupMap: Record<string, string> = {};
  for (const g of GROUPS) {
    const group = await prisma.group.upsert({
      where: { code: g.code },
      update: { name: g.name, displayOrder: g.displayOrder },
      create: g,
    });
    groupMap[g.code] = group.id;
  }

  const teamMap: Record<string, string> = {};
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
  return { groupMap, teamMap };
}

async function seedFixtures(groupMap: Record<string, string>, teamMap: Record<string, string>) {
  for (const f of GROUP_FIXTURES) {
    const existing = await prisma.match.findFirst({
      where: {
        stage: MatchStage.GROUP,
        groupId: groupMap[f.group],
        homeTeamId: teamMap[f.home],
        awayTeamId: teamMap[f.away],
        matchday: f.matchday,
      },
    });
    if (existing) continue;

    // Store as noon UTC on that calendar date so Lagos date is preserved (Lagos = UTC+1)
    const kickoffAt = new Date(`${f.date}T15:00:00.000Z`);

    await prisma.match.create({
      data: {
        stage: MatchStage.GROUP,
        groupId: groupMap[f.group],
        homeTeamId: teamMap[f.home],
        awayTeamId: teamMap[f.away],
        kickoffAt,
        status: MatchStatus.SCHEDULED,
        matchday: f.matchday,
        published: true,
      },
    });
  }

  for (const k of KNOCKOUT) {
    const existing = await prisma.match.findFirst({
      where: { slotCode: k.slotCode },
    });
    if (existing) continue;

    const kickoffAt = new Date(`${k.date}T15:00:00.000Z`);
    await prisma.match.create({
      data: {
        stage: k.stage,
        slotCode: k.slotCode,
        homeSlot: k.homeSlot,
        awaySlot: k.awaySlot,
        kickoffAt,
        status: MatchStatus.SCHEDULED,
        published: true,
      },
    });
  }
}

async function seedSettings() {
  const settings = [
    { key: "competition_name", value: "League Management" },
    { key: "sponsor", value: "High Chief Dickson Oguguo Nzenwa. Aku Bara-Oha 1 Of Ibeku Ancient Kingdom" },
    { key: "qualification_top_n", value: "2" },
    { key: "prediction_disclaimer", value: "Predictions are for entertainment only. No money or prizes are staked or paid through this platform." },
    { key: "timezone", value: "Africa/Lagos" },
  ];
  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }
}

async function bootstrapPrimaryAdmin() {
  const username = process.env.PRIMARY_ADMIN_USERNAME;
  const password = process.env.PRIMARY_ADMIN_PASSWORD;
  const phone = process.env.PRIMARY_ADMIN_PHONE;

  if (!username || !password || !phone) {
    console.log("[seed] PRIMARY_ADMIN_* not set — skipping primary admin bootstrap");
    return;
  }

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedPhone = phone.replace(/\D/g, "");

  const existing = await prisma.user.findFirst({
    where: { role: "PRIMARY_ADMIN" },
  });

  if (existing) {
    console.log("[seed] Primary admin already exists — not resetting password");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      username: username.trim(),
      normalizedUsername,
      phone: phone.trim(),
      normalizedPhone,
      passwordHash,
      role: "PRIMARY_ADMIN",
      status: "ACTIVE",
    },
  });
  console.log("[seed] Primary admin created from environment variables");
}

async function main() {
  console.log("Seeding League Management…");
  const { groupMap, teamMap } = await seedGroupsAndTeams();
  await seedFixtures(groupMap, teamMap);
  await seedSettings();
  await bootstrapPrimaryAdmin();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
