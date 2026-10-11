import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { matches } from "@/data/matches";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prono70 — Pronostics football Top 5" },
      { name: "description", content: "Pronostics des matchs du Top 5 européen : vainqueur probable, score exact et confiance." },
      { property: "og:title", content: "Prono70 — Pronostics football Top 5" },
      { property: "og:description", content: "Pronostics des matchs du Top 5 européen sur 3 jours." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const ONGLETS = [
  { id: "aujourdhui", label: "Aujourd'hui" },
  { id: "demain", label: "Demain" },
  { id: "apresdemain", label: "Après-demain" },
] as const;

function Home() {
  const [onglet, setOnglet] = useState<(typeof ONGLETS)[number]["id"]>("aujourdhui");
  const list = matches.filter((m) => m.jour === onglet);

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 font-sans">
      <h1 className="font-display text-5xl tracking-wide text-primary">Prono70</h1>
      <nav className="flex flex-wrap gap-2">
        {ONGLETS.map((o) => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            className={`rounded-md border border-border px-4 py-2 text-sm font-semibold ${onglet === o.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-secondary"}`}>
            {o.label} ({matches.filter((m) => m.jour === o.id).length})
          </button>
        ))}
      </nav>
      <h2 className="font-display text-3xl text-accent">{ONGLETS.find((o) => o.id === onglet)!.label} · {list.length} match(s)</h2>
      {list.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-6 text-center">Aucun match ce jour-là.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((m) => (
            <li key={m.id}>
              <Link to="/match/$id" params={{ id: String(m.id) }} className="block rounded-lg border border-border bg-card p-4 hover:bg-secondary">
                <p className="text-xs uppercase text-muted-foreground">⏰ {m.heure} · {m.league}</p>
                <p className="mt-1 text-lg font-semibold">{m.home} vs {m.away}</p>
                <p className="text-sm text-muted-foreground">Prono : <b className="text-primary">{m.prono}</b> · Score : {m.score} · Confiance {m.confiance}%</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
