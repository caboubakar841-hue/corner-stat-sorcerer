import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const BIG_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 848, 94, 88, 203, 307];

export type Fx = {
  id: number; date: string; ts: number; status: string; statusLong: string;
  elapsed: number | null; league: string; country: string; leagueId: number;
  leagueLogo: string; home: string; away: string; homeLogo: string; awayLogo: string;
  goalsHome: number | null; goalsAway: number | null; big: boolean;
};

async function call(path: string): Promise<any[]> {
  const rapid = process.env["RAPIDAPI_KEY"];
  if (!rapid) throw new Error("NO_RAPID_KEY");
  const res = await fetch(`https://api-football-v1.p.rapidapi.com/v3${path}`, {
    headers: { "x-rapidapi-key": rapid, "x-rapidapi-host": "api-football-v1.p.rapidapi.com" },
  });
  const json = await res.json();
  return json.response ?? [];
}

function map(r: any): Fx {
  return {
    id: r.fixture.id, date: r.fixture.date, ts: r.fixture.timestamp,
    status: r.fixture.status.short, statusLong: r.fixture.status.long,
    elapsed: r.fixture.status.elapsed, league: r.league.name,
    country: r.league.country, leagueId: r.league.id, leagueLogo: r.league.logo,
    home: r.teams.home.name, away: r.teams.away.name,
    homeLogo: r.teams.home.logo, awayLogo: r.teams.away.logo,
    goalsHome: r.goals.home, goalsAway: r.goals.away,
    big: BIG_LEAGUES.includes(r.league.id),
  };
}

export const getTodayFixtures = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const all = (await call(`/fixtures?date=${data.date}&timezone=Africa/Abidjan`)).map(map);
    // GRANDS TOUJOURS EN HAUT
    all.sort((a, b) => {
      if (a.big !== b.big) return Number(b.big) - Number(a.big);
      return a.ts - b.ts;
    });
    return all;
  });

// getFixture et getPrediction restent identiques, appelle call()
