import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FIXTURES, dayKey, fixturesOn, localDate, nextFixture, predict } from "@/data/fixtures";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prono70 — Pronostics football Top 5" },
      { name: "description", content: "Pronostics locaux des matchs du Top 5 européen sur 4 jours : vainqueur, score exact, buts attendus." },
      { property: "og:title", content: "Prono70 — Pronostics football Top 5" },
      { property: "og:description", content: "Pronostics locaux des matchs du Top 5 européen sur 4 jours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const LABELS = ["Aujourd'hui", "Demain", "Après-demain", "J+3"];
const fmt = (key: string) => new Date(key + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
const relDay = (fromKey: string, iso: string) => {
  const days = Math.round((new Date(iso.slice(0, 10) + "T12:00:00").getTime() - new Date(fromKey + "T12:00:00").getTime()) / 864e5);
  return days === 1 ? "demain" : `le ${new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`;
};

function Home() {
  const [base, setBase] = useState<Date | null>(null);
  const [tab, setTab] = useState(0);
  useEffect(() => {
    console.log("Fixtures chargées :", FIXTURES);
    setBase(new Date());
  }, []);
  useEffect(() => {
    if (!base) return;
    // Onglet par défaut : Aujourd'hui, mais si 0 match aujourd'hui on bascule sur Demain
    const today = localDate(new Date());
    if (fixturesOn(today).length === 0 && fixturesOn(dayKey(1, base)).length > 0) setTab(1);
  }, [base]);
  if (!base) return null;
  const keys = LABELS.map((_, i) => dayKey(i, base));
  const key = keys[tab]!;
  const list = fixturesOn(key);
  const next = nextFixture(key);
  // Aucun match sur toute la période : on affiche quand même tout avec un bandeau
  const totalPeriod = keys.reduce((n, k) => n + fixturesOn(k).length, 0);
  const showAll = totalPeriod === 0 && FIXTURES.length > 0;

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 font-sans">
      <h1 className="font-display text-5xl tracking-wide text-primary">Prono70</h1>
      <nav className="flex flex-wrap gap-2">
        {LABELS.map((l, i) => (
          <button key={l} onClick={() => setTab(i)}
            className={`rounded-md border border-border px-3 py-2 text-sm font-semibold ${i === tab ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}>
            {l} ({fixturesOn(keys[i]!).length})
          </button>
        ))}
      </nav>
      <h2 className="font-display text-3xl text-accent">{LABELS[tab]} - {fmt(key)} · {list.length} match(s)</h2>
      {showAll && (
        <p className="rounded-lg border border-orange-500 bg-orange-500/15 p-3 text-center text-sm font-semibold text-orange-400">
          ⚠️ Matchs à venir — aucun match ne correspond aux 4 prochains jours, voici tous les matchs enregistrés.
        </p>
      )}
      {showAll ? (
        <ul className="space-y-3">
          {FIXTURES.map((f) => {
            const p = predict(f);
            return (
              <li key={f.id}>
                <Link to="/match/$id" params={{ id: String(f.id) }} className="block rounded-lg border border-border bg-card p-4 hover:bg-secondary">
                  <p className="text-xs uppercase text-muted-foreground">📌 {f.league} · {new Date(f.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} {new Date(f.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="mt-1 text-lg font-semibold">{f.home} vs {f.away}</p>
                  <p className="text-sm text-muted-foreground">Vainqueur : <b className="text-primary">{p.winner}</b> · Score : {p.score} · Confiance {p.confidence}%</p>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : list.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center">
          Pas de Top 5 {tab === 0 ? "aujourd'hui" : "ce jour-là"}
          {next && <> - Prochain match : <Link to="/match/$id" params={{ id: String(next.id) }} className="font-semibold text-primary underline">{next.home} vs {next.away}</Link> {relDay(key, next.date)}</>}
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((f) => {
            const p = predict(f);
            return (
              <li key={f.id}>
                <Link to="/match/$id" params={{ id: String(f.id) }} className="block rounded-lg border border-border bg-card p-4 hover:bg-secondary">
                  <p className="text-xs uppercase text-muted-foreground">📌 {f.league} · {new Date(f.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                  <p className="mt-1 text-lg font-semibold">{f.home} vs {f.away}</p>
                  <p className="text-sm text-muted-foreground">Vainqueur : <b className="text-primary">{p.winner}</b> · Score : {p.score} · Confiance {p.confidence}%</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <p className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
        Debug : {FIXTURES.length} matchs chargés
      </p>
    </div>
  );
}
