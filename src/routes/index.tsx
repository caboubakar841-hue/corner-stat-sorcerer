import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getTodayFixtures, type Fx } from "@/lib/fixtures.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prono70 — Matchs de football du jour" },
      { name: "description", content: "Tous les matchs de football du jour, grands championnats en premier." },
      { property: "og:title", content: "Prono70 — Matchs de football du jour" },
      { property: "og:description", content: "Matchs du jour : Premier League, Liga, Serie A, Ligue des Champions et plus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const PAGE = 50;

export function heureGMT(iso: string) {
  return new Date(iso).toISOString().slice(11, 16);
}

function Home() {
  const today = new Date().toISOString().split("T")[0];
  const [shown, setShown] = useState(PAGE);
  const q = useQuery({
    queryKey: ["fixtures", today],
    queryFn: () => getTodayFixtures({ data: { date: today } }),
    staleTime: 5 * 60_000,
  });
  const list = q.data ?? [];

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 font-sans">
      <h1 className="font-display text-5xl tracking-wide text-primary">Prono70</h1>
      <h2 className="font-display text-3xl text-accent">Aujourd'hui · {today} · {list.length} match(s)</h2>
      {q.isLoading && <p className="rounded-lg border border-border bg-card p-6 text-center">Chargement des matchs…</p>}
      {q.isError && (
        <div className="rounded-lg border border-destructive bg-card p-6 text-center">
          <p>Erreur : {(q.error as Error).message}</p>
          <button onClick={() => q.refetch()} className="mt-3 rounded-md bg-primary px-4 py-2 text-primary-foreground">Relancer</button>
        </div>
      )}
      {q.isSuccess && list.length === 0 && (
        <p className="rounded-lg border border-border bg-card p-6 text-center">Aucun match aujourd'hui.</p>
      )}
      <ul className="space-y-2">
        {list.slice(0, shown).map((m) => <Row key={m.id} m={m} />)}
      </ul>
      {shown < list.length && (
        <button onClick={() => setShown((s) => s + PAGE)} className="w-full rounded-md border border-border bg-card py-3 font-semibold hover:bg-secondary">
          Voir plus ({list.length - shown} restants)
        </button>
      )}
    </div>
  );
}

function Row({ m }: { m: Fx }) {
  const score = m.goalsHome != null ? `${m.goalsHome} - ${m.goalsAway}` : "vs";
  return (
    <li>
      <Link to="/match/$id" params={{ id: String(m.id) }} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-secondary">
        <div className="w-14 text-center">
          <p className="font-semibold">{heureGMT(m.date)}</p>
          <p className="text-[10px] uppercase text-muted-foreground">{m.status}{m.elapsed && m.status !== "FT" ? ` ${m.elapsed}'` : ""}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <img src={m.leagueLogo} alt="" className="h-4 w-4" loading="lazy" />
            {m.big && "📌 "}{m.league} · {m.country}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 font-semibold">
            <img src={m.homeLogo} alt="" className="h-5 w-5" loading="lazy" />{m.home}
            <span className="text-accent">{score}</span>
            {m.away}<img src={m.awayLogo} alt="" className="h-5 w-5" loading="lazy" />
          </p>
        </div>
      </Link>
    </li>
  );
}
