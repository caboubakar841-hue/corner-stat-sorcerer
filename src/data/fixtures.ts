// Matchs saisis à la main (aucune requête API).
// Semaine du 10 au 13 octobre 2026 : matchs des grands championnats européens.
export type LocalFixture = { id: number; date: string; league: string; home: string; away: string };

export const FIXTURES: LocalFixture[] = [
  // Samedi 10 octobre 2026
  { id: 1, date: "2026-10-10T13:30:00+02:00", league: "Premier League", home: "Arsenal", away: "Chelsea" },
  { id: 2, date: "2026-10-10T16:00:00+02:00", league: "Premier League", home: "Liverpool", away: "Manchester United" },
  { id: 3, date: "2026-10-10T16:00:00+02:00", league: "La Liga", home: "Real Madrid", away: "Villarreal" },
  { id: 4, date: "2026-10-10T18:30:00+02:00", league: "Premier League", home: "Manchester City", away: "Tottenham" },
  { id: 5, date: "2026-10-10T21:00:00+02:00", league: "La Liga", home: "Barcelone", away: "Séville" },
  { id: 6, date: "2026-10-10T20:45:00+02:00", league: "Serie A", home: "Inter Milan", away: "AS Rome" },
  // Dimanche 11 octobre 2026
  { id: 7, date: "2026-10-11T15:00:00+02:00", league: "Premier League", home: "Newcastle", away: "Aston Villa" },
  { id: 8, date: "2026-10-11T17:30:00+02:00", league: "La Liga", home: "Atlético Madrid", away: "Real Sociedad" },
  { id: 9, date: "2026-10-11T18:00:00+02:00", league: "Serie A", home: "Naples", away: "Juventus" },
  { id: 10, date: "2026-10-11T20:45:00+02:00", league: "Ligue 1", home: "PSG", away: "Marseille" },
  { id: 11, date: "2026-10-11T18:30:00+02:00", league: "Bundesliga", home: "Bayern Munich", away: "Bayer Leverkusen" },
  // Lundi 12 octobre 2026
  { id: 12, date: "2026-10-12T20:00:00+02:00", league: "Premier League", home: "Brighton", away: "West Ham" },
  { id: 13, date: "2026-10-12T21:00:00+02:00", league: "La Liga", home: "Betis", away: "Valence" },
  { id: 14, date: "2026-10-12T20:45:00+02:00", league: "Ligue 1", home: "Monaco", away: "Lille" },
  // Mardi 13 octobre 2026
  { id: 15, date: "2026-10-13T20:45:00+02:00", league: "Serie A", home: "AC Milan", away: "Lazio" },
  { id: 16, date: "2026-10-13T18:30:00+02:00", league: "Bundesliga", home: "Borussia Dortmund", away: "RB Leipzig" },
];

// 5 derniers résultats (fictifs) : [buts marqués, buts encaissés]
export const FORM: Record<string, [number, number][]> = {
  Arsenal: [[2, 0], [3, 1], [1, 1], [2, 1], [4, 0]],
  Chelsea: [[2, 1], [3, 0], [1, 1], [2, 0], [1, 2]],
  Liverpool: [[3, 1], [2, 0], [2, 2], [4, 1], [1, 0]],
  "Manchester United": [[1, 1], [0, 2], [2, 1], [1, 3], [2, 0]],
  "Manchester City": [[3, 0], [2, 1], [5, 1], [2, 2], [3, 1]],
  Tottenham: [[2, 1], [1, 2], [3, 2], [0, 1], [2, 0]],
  "Real Madrid": [[2, 0], [3, 1], [1, 0], [4, 2], [2, 1]],
  Villarreal: [[1, 1], [2, 1], [0, 2], [3, 1], [1, 0]],
  Barcelone: [[3, 0], [2, 2], [4, 1], [2, 0], [3, 1]],
  Séville: [[1, 0], [0, 1], [2, 2], [1, 2], [2, 1]],
  "Inter Milan": [[2, 0], [1, 1], [3, 1], [2, 1], [1, 0]],
  "AS Rome": [[1, 0], [2, 1], [0, 0], [1, 2], [2, 0]],
  Newcastle: [[2, 1], [1, 0], [3, 2], [1, 1], [2, 0]],
  "Aston Villa": [[1, 1], [2, 0], [0, 1], [3, 1], [1, 2]],
  "Atlético Madrid": [[1, 0], [2, 1], [0, 0], [2, 0], [1, 1]],
  "Real Sociedad": [[1, 1], [0, 1], [2, 1], [1, 0], [0, 2]],
  Naples: [[2, 1], [3, 0], [1, 1], [2, 0], [1, 2]],
  Juventus: [[1, 0], [1, 1], [2, 1], [0, 1], [2, 0]],
  PSG: [[3, 1], [2, 0], [4, 1], [2, 2], [3, 0]],
  Marseille: [[2, 1], [1, 2], [3, 1], [0, 1], [2, 0]],
  "Bayern Munich": [[4, 1], [3, 0], [2, 2], [5, 2], [2, 0]],
  "Bayer Leverkusen": [[2, 1], [1, 1], [3, 2], [2, 0], [1, 1]],
  Brighton: [[2, 1], [1, 1], [0, 2], [3, 1], [2, 0]],
  "West Ham": [[1, 1], [0, 2], [2, 1], [1, 0], [0, 1]],
  Betis: [[2, 1], [1, 0], [1, 1], [0, 2], [3, 1]],
  Valence: [[1, 0], [0, 1], [2, 2], [1, 1], [0, 2]],
  Monaco: [[2, 1], [3, 1], [1, 1], [2, 0], [1, 2]],
  Lille: [[1, 0], [2, 1], [0, 0], [1, 1], [2, 1]],
  "AC Milan": [[2, 0], [1, 1], [3, 1], [1, 0], [2, 1]],
  Lazio: [[1, 1], [2, 0], [0, 1], [2, 2], [1, 0]],
  "Borussia Dortmund": [[3, 1], [2, 2], [4, 0], [1, 1], [2, 1]],
  "RB Leipzig": [[2, 1], [1, 0], [3, 2], [0, 1], [2, 0]],
};

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const DEFAULT: [number, number][] = [[1, 1], [1, 1], [2, 1], [1, 2], [1, 1]];

export type LocalPrediction = {
  xgHome: number; xgAway: number; winner: string; score: string; confidence: number;
  formHome: [number, number][]; formAway: [number, number][];
};

export function predict(f: LocalFixture): LocalPrediction {
  const fh = FORM[f.home] ?? DEFAULT, fa = FORM[f.away] ?? DEFAULT;
  const atkH = avg(fh.map((r) => r[0])), defH = avg(fh.map((r) => r[1]));
  const atkA = avg(fa.map((r) => r[0])), defA = avg(fa.map((r) => r[1]));
  // buts attendus = attaque - défense adverse (+ base 1 pour rester positif)
  const xgHome = Math.max(0.2, +(atkH - defA + 1).toFixed(1));
  const xgAway = Math.max(0.2, +(atkA - defH + 1).toFixed(1));
  const diff = Math.abs(xgHome - xgAway);
  return {
    xgHome, xgAway,
    winner: xgHome === xgAway ? "Match nul" : xgHome > xgAway ? f.home : f.away,
    score: `${Math.round(xgHome)}-${Math.round(xgAway)}`,
    confidence: Math.min(99, Math.round(diff * 30 + 50)),
    formHome: fh, formAway: fa,
  };
}

// Clé de date locale YYYY-MM-DD (comme new Date().toISOString().split("T")[0] mais en heure de Paris)
export const localDate = (d: Date) =>
  d.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });

export const dayKey = (offset: number, base = new Date()) => {
  const d = new Date(base); d.setDate(d.getDate() + offset);
  return localDate(d);
};
export const fixturesOn = (key: string) =>
  FIXTURES.filter((f) => localDate(new Date(f.date)) === key);
export const nextFixture = (afterKey: string) =>
  FIXTURES.filter((f) => localDate(new Date(f.date)) > afterKey)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
