// Matchs saisis à la main (aucune requête API).
// 10-13 octobre 2026 = trêve internationale FIFA : aucun match de Top 5.
export type LocalFixture = { id: number; date: string; league: string; home: string; away: string };

export const FIXTURES: LocalFixture[] = [
  { id: 1, date: "2026-10-17T13:30:00+02:00", league: "Premier League", home: "Chelsea", away: "Everton" },
];

// 5 derniers résultats fictifs : [buts marqués, buts encaissés]
export const FORM: Record<string, [number, number][]> = {
  Chelsea: [[2, 1], [3, 0], [1, 1], [2, 0], [1, 2]],
  Everton: [[1, 1], [0, 2], [2, 1], [1, 3], [0, 1]],
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

export const dayKey = (offset: number, base = new Date()) => {
  const d = new Date(base); d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
};
export const fixturesOn = (key: string) =>
  FIXTURES.filter((f) => new Date(f.date).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }) === key);
export const nextFixture = (afterKey: string) =>
  FIXTURES.filter((f) => new Date(f.date).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }) > afterKey)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
