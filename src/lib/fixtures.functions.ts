 import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const BIG_LEAGUES = [39, 140, 135, 78, 61, 2, 3, 307, 94];

export type Fx = {
  id: number; date: string; ts: number; status: string; statusLong: string;
  elapsed: number | null; league: string; country: string; leagueId: number;
  leagueLogo: string; home: string; away: string; homeLogo: string; awayLogo: string;
  goalsHome: number | null; goalsAway: number | null; big: boolean;
};

// TES 3 CLES DIRECTEMENT DEDANS
const DIRECT_KEYS = [
  "fbbfb375986d02b3ae1f08d1eada9da5",
  "baff2cce41d6e0e650350209d8266cfc",
  "0a51259d070da43625df6bd84fac9973",
];

function getAllKeys(): string[] {
  const envKeys = [
    process.env["API_FOOTBALL_KEY_1"],
    process.env["API_FOOTBALL_KEY_2"],
    process.env["API_FOOTBALL_KEY_3"],
    process.env["API_FOOTBALL_KEY"],
  ].filter(Boolean) as string[];
  return [...DIRECT_KEYS, ...envKeys.flatMap(k => k.split(",").map(s => s.trim()).filter(Boolean))];
}

async function call(path: string): Promise<any[]> {
  const keys = getAllKeys();
  const rapid = process.env["RAPIDAPI_KEY"];

  for (const direct of keys) {
    try {
      const res = await fetch(`https://v3.football.api-sports.io${path}`, { 
        headers: { "x-apisports-key": direct } 
      });
      const json: any = await res.json();
      const errs = json?.errors && Object.values(json.errors).join(" ").toLowerCase();
      if (errs && (errs.includes("limit") || errs.includes("requests") || errs.includes("rate"))) {
        console.warn(`Clé ${direct.slice(0,5)}... à 100%, rotation`);
        continue;
      }
      if (res.ok && json.response) return json.response;
    } catch { continue; }
  }

  if (rapid) {
    try {
      const res = await fetch(`https://api-football-v1.p.rapidapi.com/v3${path}`, {
        headers: { "x-rapidapi-key": rapid, "x-rapidapi-host": "api-football-v1.p.rapidapi.com" },
      });
      const json = await res.json();
      return json.response ?? [];
    } catch {}
  }

  throw new Error("LIMIT_ATTEINTE");
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

const cache = new Map<string, { at: number; data: Fx[] }>();
const CACHE_TTL = 6 * 60 * 60 * 1000;

export const getTodayFixtures = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(d))
  .handler(async ({ data }) => {
    const c = cache.get(data.date);
    if (c && Date.now() - c.at < CACHE_TTL) return c.data;
    try {
      const list = (await call(`/fixtures?date=${data.date}&timezone=Africa/Abidjan`)).map(map);
      list.sort((a, b) => Number(b.big) - Number(a.big) || a.ts - b.ts);
      cache.set(data.date, { at: Date.now(), data: list });
      return list;
    } catch (e: any) {
      if (e.message === "LIMIT_ATTEINTE" && c) return c.data;
      throw e;
    }
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
export type Analysis = { id: number; result: Pick | null; safe: Pick | null; exact?: Pick | null; btts?: Pick | null; conf: number };

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
    if (!r) return { id, result: null, safe: null, exact: null, btts: null, conf: 0 };
    const pc = (s: string) => parseInt(s ?? "0") || 0;
    const h = pc(r.predictions?.percent?.home), d = pc(r.predictions?.percent?.draw), a = pc(r.predictions?.percent?.away);
    const opts: Pick[] = [
      { label: "Victoire Domicile", pct: h }, { label: "Victoire Extérieur", pct: a },
      { label: "Domicile ou Nul (1X)", pct: h + d }, { label: "Extérieur ou Nul (X2)", pct: a + d },
    ];
    const win = (h >= a ? opts[0] : opts[1])!;
    const result = win.pct >= 65 ? win : opts.slice(2).sort((x, y) => y.pct - x.pct)[0];
    const num = (v: any) => parseFloat(v) || 0;
    const th = r.teams?.home?.last_5?.goals, ta = r.teams?.away?.last_5?.goals;
    const lambda = (num(th?.for?.average) + num(ta?.against?.average)) / 2 + (num(ta?.for?.average) + num(th?.against?.average)) / 2;
    const safe = lambda > 0
      ? (() => { const o15 = Math.round(poissonOver(lambda, 1) * 100), o25 = Math.round(poissonOver(lambda, 2) * 100);
          return o25 >= 70 ? { label: "Over 2.5 Buts", pct: o25 } : { label: "Over 1.5 Buts", pct: o15 }; })()
      : null;
    const lh = (num(th?.for?.average) + num(ta?.against?.average)) / 2;
    const la = (num(ta?.for?.average) + num(th?.against?.average)) / 2;
    const pois = (l: number, k: number) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return (Math.exp(-l) * l ** k) / f; };
    let exact: Pick | null = null;
    let btts: Pick | null = null;
    if (lh > 0 || la > 0) {
      let best = { h: 0, a: 0, p: 0 };
      for (let i = 0; i <= 5; i++) for (let j = 0; j <= 5; j++) {
        const p = pois(lh, i) * pois(la, j);
        if (p > best.p) best = { h: i, a: j, p };
      }
      exact = { label: `${best.h}-${best.a}`, pct: Math.round(best.p * 100) };
      const yes = Math.round((1 - Math.exp(-lh)) * (1 - Math.exp(-la)) * 100);
      btts = yes >= 50 ? { label: "Les deux marquent : OUI", pct: yes } : { label: "Les deux marquent : NON", pct: 100 - yes };
    }
    const out: Analysis = {
      id, result: result && result.pct >= 65 ? result : null,
      safe: safe && safe.pct >= 65 ? safe : null, exact, btts,
      conf: Math.max(result?.pct ?? 0, safe?.pct ?? 0),
    };
    predCache.set(data.id, out);
    return out;
  });
