import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const BIG_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 307, 94];

export type Fx = {
  id: number;
  date: string;
  ts: number;
  status: string;
  statusLong: string;
  elapsed: number | null;
  league: string;
  country: string;
  leagueId: number;
  leagueLogo: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  goalsHome: number | null;
  goalsAway: number | null;
  big: boolean;
};

async function call(path: string): Promise<any[]> {
  const direct = process.env["API_FOOTBALL_KEY"];
  const rapid = process.env["RAPIDAPI_KEY"];
  let res: Response | null = null;
  if (direct) {
    res = await fetch(`https://v3.football.api-sports.io${path}`, { headers: { "x-apisports-key": direct } });
  }
  if ((!res || !res.ok) && (rapid || direct)) {
    res = await fetch(`https://api-football-v1.p.rapidapi.com/v3${path}`, {
      headers: { "x-rapidapi-key": (rapid || direct)!, "x-rapidapi-host": "api-football-v1.p.rapidapi.com" },
    });
  }
  if (!res) throw new Error("Clé API manquante");
  const json: any = await res.json();
  const errs = json?.errors && Object.values(json.errors);
  if (errs && errs.length) throw new Error(String(errs[0]));
  return json.response ?? [];
}

function map(r: any): Fx {
  return {
    id: r.fixture.id,
    date: r.fixture.date,
    ts: r.fixture.timestamp,
    status: r.fixture.status.short,
    statusLong: r.fixture.status.long,
    elapsed: r.fixture.status.elapsed,
    league: r.league.name,
    country: r.league.country,
    leagueId: r.league.id,
    leagueLogo: r.league.logo,
    home: r.teams.home.name,
    away: r.teams.away.name,
    homeLogo: r.teams.home.logo,
    awayLogo: r.teams.away.logo,
    goalsHome: r.goals.home,
    goalsAway: r.goals.away,
    big: BIG_LEAGUES.includes(r.league.id),
  };
}

const cache = new Map<string, { at: number; data: Fx[] }>();

export const getTodayFixtures = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const c = cache.get(data.date);
    if (c && Date.now() - c.at < 10 * 60_000) return c.data;
    const list = (await call(`/fixtures?date=${data.date}&timezone=Africa/Abidjan`)).map(map);
    list.sort((a, b) => Number(b.big) - Number(a.big) || a.ts - b.ts);
    cache.set(data.date, { at: Date.now(), data: list });
    return list;
  });

export const getFixture = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().regex(/^\d+$/) }).parse(d))
  .handler(async ({ data }) => {
    for (const c of cache.values()) {
      const f = c.data.find((x) => String(x.id) === data.id);
      if (f) return f;
    }
    const r = await call(`/fixtures?id=${data.id}&timezone=Africa/Abidjan`);
    return r[0] ? map(r[0]) : null;
  });
