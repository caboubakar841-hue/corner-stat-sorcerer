import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// GRANDS TOUJOURS EN HAUT
export const BIG_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 848, 94, 88, 203, 307, 15, 5];

export type Fx = {
  id: number; date: string; ts: number; status: string; statusLong: string;
  elapsed: number | null; league: string; country: string; leagueId: number;
  leagueLogo: string; home: string; away: string; homeLogo: string; awayLogo: string;
  goalsHome: number | null; goalsAway: number | null; big: boolean;
};

function mapFixture(r: any): Fx {
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

async function callApi(path: string): Promise<any[]> {
  const rapidKey = process.env["RAPIDAPI_KEY"] || process.env["VITE_RAPIDAPI_KEY"];
  if (!rapidKey) {
    console.log("Pas de RAPIDAPI_KEY, retour vide pour éviter le crash");
    return [];
  }
  try {
    const res = await fetch(`https://api-football-v1.p.rapidapi.com/v3${path}`, {
      headers: {
        "x-rapidapi-key": rapidKey,
        "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
      },
    });
    const json = await res.json();
    return json.response ?? [];
  } catch (e) {
    console.error("Erreur API", e);
    return [];
  }
}

export const getTodayFixtures = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const raw = await callApi(`/fixtures?date=${data.date}&timezone=Africa/Abidjan`);
    const all = raw.map(mapFixture);
    // TRI DEMANDÉ : GRANDS EN HAUT MÊME À 22H
    all.sort((a, b) => {
      if (a.big !== b.big) return Number(b.big) - Number(a.big);
      return a.ts - b.ts;
    });
    return all;
  });
