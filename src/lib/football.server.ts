const BASE = "https://v3.football.api-sports.io";

export const LEAGUES: Record<string, number[] | null> = {
  top5: [39, 140, 135, 78, 61],
  europe: [2, 3, 848],
  afrique: [6, 12, 20, 386, 233, 200, 186, 202, 288, 399],
  tous: null,
};

// Grands championnats : leurs matchs sont épinglés en tête de toutes les listes
export const TOP_LEAGUE_IDS = new Set<number>(LEAGUES.top5!);

export const THRESHOLD = 0.7;

async function api<T = any>(path: string, params: Record<string, string | number>, key: string): Promise<T[]> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  // Essai 1 : clé directe API-Sports (dashboard.api-football.com)
  let res = await fetch(`${BASE}${path}?${qs}`, { headers: { "x-apisports-key": key } });
  // Essai 2 : clé RapidAPI (api-football-v1.p.rapidapi.com) si la clé directe est refusée
  if (res.status === 403) {
    res = await fetch(`https://api-football-v1.p.rapidapi.com/v3${path}?${qs}`, {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": "api-football-v1.p.rapidapi.com" },
    });
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API-Football [${res.status}]: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { response: T[]; errors: unknown };
  const errs = json.errors;
  if (errs && !Array.isArray(errs) && Object.keys(errs as object).length) {
    throw new Error(`API-Football : ${Object.values(errs as Record<string, string>).join(" · ")}`);
  }
  return json.response ?? [];
}

const fact = (n: number) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
const pois = (k: number, l: number) => (Math.exp(-l) * l ** k) / fact(k);
const overProb = (line: number, l: number) => {
  let p = 0;
  for (let k = 0; k <= Math.floor(line); k++) p += pois(k, l);
  return 1 - p;
};
const num = (v: unknown, d = 0) => { const n = parseFloat(String(v ?? "")); return Number.isFinite(n) ? n : d; };

export type Market = { label: string; prob: number; group: "winner" | "goals" | "corners" };
export type H2H = { date: string; home: string; away: string; score: string; corners: number | null };
export type Analysis = {
  id: number; date: string; league: string; leagueLogo: string; country: string; top: boolean;
  home: { name: string; logo: string }; away: { name: string; logo: string };
  xgHome: number; xgAway: number; xCorners: number | null;
  markets: Market[]; h2h: H2H[];
  h2hInfluence: { goalsAvg: number | null; cornersAvg: number | null; homeWins: number; draws: number; awayWins: number; weight: number };
};

async function analyze(fx: any, key: string): Promise<Analysis | null> {
  const [pred] = await api<any>("/predictions", { fixture: fx.fixture.id }, key);
  if (!pred) return null;
  const th = pred.teams.home, ta = pred.teams.away;
  const homeId = fx.teams.home.id;

  // Base expected goals from last-5 form (attack vs opposing defence)
  let lh = (num(th.last_5?.goals?.for?.average, 1.3) + num(ta.last_5?.goals?.against?.average, 1.3)) / 2;
  let la = (num(ta.last_5?.goals?.for?.average, 1.1) + num(th.last_5?.goals?.against?.average, 1.1)) / 2;

  // Head-to-head
  const h2hRaw: any[] = (pred.h2h ?? []).filter((m: any) => m.goals?.home != null).slice(0, 5);
  let hw = 0, dr = 0, aw = 0, gh = 0, ga = 0;
  for (const m of h2hRaw) {
    const isHome = m.teams.home.id === homeId;
    const g1 = isHome ? m.goals.home : m.goals.away, g2 = isHome ? m.goals.away : m.goals.home;
    gh += g1; ga += g2;
    if (g1 > g2) hw++; else if (g1 < g2) aw++; else dr++;
  }
  const n = h2hRaw.length;
  const w = (Math.min(n, 5) / 5) * 0.3;
  if (n) { lh = lh * (1 - w) + (gh / n) * w; la = la * (1 - w) + (ga / n) * w; }
  lh = Math.max(0.2, lh); la = Math.max(0.2, la);

  // Corners from up to 3 recent h2h matches
  const cornerList: (number | null)[] = await Promise.all(
    h2hRaw.slice(0, 3).map(async (m) => {
      try {
        const st = await api<any>("/fixtures/statistics", { fixture: m.fixture.id }, key);
        if (st.length < 2) return null;
        const c = st.reduce((s: number, t: any) => s + num(t.statistics.find((x: any) => x.type === "Corner Kicks")?.value), 0);
        return c || null;
      } catch { return null; }
    }),
  );
  const cv = cornerList.filter((c): c is number => c != null);
  const cornersAvg = cv.length ? cv.reduce((a, b) => a + b, 0) / cv.length : null;

  // Outcome probabilities via Poisson grid
  let pH = 0, pD = 0, pA = 0;
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
    const p = pois(i, lh) * pois(j, la);
    if (i > j) pH += p; else if (i === j) pD += p; else pA += p;
  }
  if (n) { pH = pH * (1 - w) + (hw / n) * w; pD = pD * (1 - w) + (dr / n) * w; pA = pA * (1 - w) + (aw / n) * w; }
  const total = lh + la;
  const hn = fx.teams.home.name, an = fx.teams.away.name;

  const markets: Market[] = [
    { label: `Victoire ${hn}`, prob: pH, group: "winner" },
    { label: `Victoire ${an}`, prob: pA, group: "winner" },
    { label: `${hn} ou nul`, prob: pH + pD, group: "winner" },
    { label: `${an} ou nul`, prob: pA + pD, group: "winner" },
    { label: "Plus de 1,5 buts", prob: overProb(1.5, total), group: "goals" },
    { label: "Plus de 2,5 buts", prob: overProb(2.5, total), group: "goals" },
    { label: "Moins de 3,5 buts", prob: 1 - overProb(3.5, total), group: "goals" },
    { label: "Les deux équipes marquent", prob: (1 - Math.exp(-lh)) * (1 - Math.exp(-la)), group: "goals" },
  ];
  if (cornersAvg != null) {
    for (const line of [7.5, 8.5, 9.5]) markets.push({ label: `Plus de ${String(line).replace(".", ",")} corners`, prob: overProb(line, cornersAvg), group: "corners" });
    for (const line of [10.5, 11.5]) markets.push({ label: `Moins de ${String(line).replace(".", ",")} corners`, prob: 1 - overProb(line, cornersAvg), group: "corners" });
  }
  const strong = markets.filter((m) => m.prob >= THRESHOLD);
  if (!strong.length) return null;

  return {
    id: fx.fixture.id, date: fx.fixture.date, league: fx.league.name, leagueLogo: fx.league.logo, country: fx.league.country,
    top: TOP_LEAGUE_IDS.has(fx.league.id),
    home: { name: hn, logo: fx.teams.home.logo }, away: { name: an, logo: fx.teams.away.logo },
    xgHome: lh, xgAway: la, xCorners: cornersAvg,
    markets: strong.sort((a, b) => b.prob - a.prob),
    h2h: h2hRaw.map((m, i) => ({
      date: m.fixture.date, home: m.teams.home.name, away: m.teams.away.name,
      score: `${m.goals.home}-${m.goals.away}`, corners: cornerList[i] ?? null,
    })),
    h2hInfluence: { goalsAvg: n ? (gh + ga) / n : null, cornersAvg, homeWins: hw, draws: dr, awayWins: aw, weight: w },
  };
}

export type Fixture = { id: number; date: string; status: string; league: string; country: string; top: boolean; home: string; away: string; homeLogo: string; awayLogo: string; gh: number | null; ga: number | null };

const cache = new Map<string, { at: number; data: unknown }>();

export async function analyzeDay(date: string, category: string, limit: number, key: string) {
  const ck = `${date}|${category}|${limit}`;
  const hit = cache.get(ck);
  if (hit && Date.now() - hit.at < 3600_000) return hit.data as { fixtures: Fixture[]; analyzed: number; total: number; matches: Analysis[] };

  const all = await api<any>("/fixtures", { date, timezone: "Europe/Paris" }, key);
  const ids = LEAGUES[category];
  const inCat = all.filter((f) => !ids || ids.includes(f.league.id));
  const isTop = (f: any) => (TOP_LEAGUE_IDS.has(f.league.id) ? 1 : 0);
  // Les matchs des grands championnats sont analysés en priorité et épinglés en tête
  const pool = inCat.filter((f) => f.fixture.status.short === "NS")
    .sort((a, b) => isTop(b) - isTop(a) || a.fixture.date.localeCompare(b.fixture.date))
    .slice(0, limit);
  const fixtures: Fixture[] = inCat.map((f) => ({
    id: f.fixture.id, date: f.fixture.date, status: f.fixture.status.short, league: f.league.name, country: f.league.country,
    top: isTop(f) === 1,
    home: f.teams.home.name, away: f.teams.away.name, homeLogo: f.teams.home.logo, awayLogo: f.teams.away.logo,
    gh: f.goals.home, ga: f.goals.away,
  })).sort((a, b) => (b.top ? 1 : 0) - (a.top ? 1 : 0) || a.date.localeCompare(b.date));
  const results: Analysis[] = [];
  for (const fx of pool) {
    try { const a = await analyze(fx, key); if (a) results.push(a); } catch (e) { console.error(e); }
  }
  const data = { fixtures, analyzed: pool.length, total: all.length, matches: results.sort((a, b) => (b.top ? 1 : 0) - (a.top ? 1 : 0) || (b.markets[0]?.prob ?? 0) - (a.markets[0]?.prob ?? 0)) };
  cache.set(ck, { at: Date.now(), data });
  return data;
}
