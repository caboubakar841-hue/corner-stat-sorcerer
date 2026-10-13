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

export type Pick = { label: string; pct: number };
export type Analysis = { id: number; result: Pick | null; safe: Pick | null; conf: number };

const predCache = new Map<string, Analysis>();

function poissonOver(lambda: number, n: number) {
  let p = 0, f = 1;
  for (let k = 0; k <= n; k++) { if (k > 0) f *= k; p += (Math.exp(-lambda) * lambda ** k) / f; }
  return 1 - p;
}

export const getPrediction = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().regex(/^\d+$/) }).parse(d))
  .handler(async ({ data }): Promise<Analysis> => {
    const c = predCache.get(data.id);
    if (c) return c;
    const r: any = (await call(`/predictions?fixture=${data.id}`))[0];
    const id = Number(data.id);
    if (!r) return { id, result: null, safe: null, conf: 0 };
    const pc = (s: string) => parseInt(s ?? "0") || 0;
    const h = pc(r.predictions?.percent?.home), d = pc(r.predictions?.percent?.draw), a = pc(r.predictions?.percent?.away);
    const opts: Pick[] = [
      { label: "Victoire Domicile", pct: h }, { label: "Victoire Extérieur", pct: a },
      { label: "Domicile ou Nul (1X)", pct: h + d }, { label: "Extérieur ou Nul (X2)", pct: a + d },
    ];
    // Prefer the straight win if strong enough, else best double chance
    const win = (h >= a ? opts[0] : opts[1])!;
    const result = win.pct >= 65 ? win : opts.slice(2).sort((x, y) => y.pct - x.pct)[0];
    const num = (v: any) => parseFloat(v) || 0;
    const th = r.teams?.home?.last_5?.goals, ta = r.teams?.away?.last_5?.goals;
    const lambda = (num(th?.for?.average) + num(ta?.against?.average)) / 2 + (num(ta?.for?.average) + num(th?.against?.average)) / 2;
    const safe = lambda > 0
      ? (() => { const o15 = Math.round(poissonOver(lambda, 1) * 100), o25 = Math.round(poissonOver(lambda, 2) * 100);
          return o25 >= 70 ? { label: "Over 2.5 Buts", pct: o25 } : { label: "Over 1.5 Buts", pct: o15 }; })()
      : null;
    const out: Analysis = {
      id,
      result: result && result.pct >= 65 ? result : null,
      safe: safe && safe.pct >= 65 ? safe : null,
      conf: Math.max(result?.pct ?? 0, safe?.pct ?? 0),
    };
    predCache.set(data.id, out);
    return out;
  });
