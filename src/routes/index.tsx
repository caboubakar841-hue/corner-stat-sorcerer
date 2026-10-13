import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getPrediction, getTodayFixtures, type Analysis, type Fx, type Pick } from "@/lib/fixtures.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prono70 — Matchs de football du jour" },
      { name: "description", content: "Tous les matchs de football du jour avec pronostics automatiques." },
      { property: "og:title", content: "Prono70 — Matchs de football du jour" },
      { property: "og:description", content: "Matchs du jour et pronostics à forte confiance, grands championnats en premier." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const PAGE = 50;
const MAX_ANALYSES = 25; // protège le quota gratuit de 100 requêtes/jour
const BATCH = 5;

function heureGMT(iso: string) {
  return new Date(iso).toISOString().slice(11, 16);
}

function Home() {
  const today = new Date().toISOString().split("T")[0];
  const [shown, setShown] = useState(PAGE);
  const [an, setAn] = useState<Record<number, Analysis>>({});
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["fixtures", today],
    queryFn: () => getTodayFixtures({ data: { date: today } }),
    staleTime: 5 * 60_000,
  });
  const list = q.data ?? [];

  useEffect(() => {
    if (!q.data) return;
    const todo = q.data.filter((m) => m.status === "NS").slice(0, MAX_ANALYSES);
    let stop = false;
    (async () => {
      setBusy(true);
      for (let i = 0; i < todo.length && !stop; i += BATCH) {
        const res = await Promise.allSettled(
          todo.slice(i, i + BATCH).map((m) => getPrediction({ data: { id: String(m.id) } })),
        );
        if (stop) break;
        setAn((prev) => {
          const n = { ...prev };
          res.forEach((r) => r.status === "fulfilled" && (n[r.value.id] = r.value));
          return n;
        });
      }
      setBusy(false);
    })();
    return () => { stop = true; };
  }, [q.data]);

  const sorted = [...list].sort((a, b) => {
    const ta = (an[a.id]?.conf ?? 0) >= 75 ? 1 : 0, tb = (an[b.id]?.conf ?? 0) >= 75 ? 1 : 0;
    return tb - ta;
  });

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 font-sans">
      <h1 className="font-display text-5xl tracking-wide text-primary">Prono70</h1>
      <h2 className="font-display text-3xl text-accent">Aujourd'hui · {today} · {list.length} match(s)</h2>
      {busy && <p className="animate-pulse rounded-lg border border-border bg-card p-3 text-center text-sm">Analyse en cours… ({Object.keys(an).length} analysés)</p>}
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
        {sorted.slice(0, shown).map((m) => <Row key={m.id} m={m} a={an[m.id]} />)}
      </ul>
      {shown < list.length && (
        <button onClick={() => setShown((s) => s + PAGE)} className="w-full rounded-md border border-border bg-card py-3 font-semibold hover:bg-secondary">
          Voir plus ({list.length - shown} restants)
        </button>
      )}
    </div>
  );
}

function badge(p: number) {
  if (p > 70) return { t: "CONFIANCE ÉLEVÉE", c: "bg-primary text-primary-foreground" };
  if (p >= 60) return { t: "MOYENNE", c: "bg-accent text-accent-foreground" };
  return { t: "RISQUÉ", c: "bg-destructive text-destructive-foreground" };
}

function PickLine({ title, p }: { title: string; p: Pick }) {
  const b = badge(p.pct);
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-xs uppercase text-muted-foreground">{title}</span>
      <b className={p.pct > 70 ? "text-primary" : ""}>{p.label} - {p.pct}%</b>
      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${b.c}`}>{b.t}</span>
    </p>
  );
}

function Row({ m, a }: { m: Fx; a: Analysis | undefined }) {
  const score = m.goalsHome != null ? `${m.goalsHome} - ${m.goalsAway}` : "vs";
  return (
    <li>
      <Link to="/match/$id" params={{ id: String(m.id) }} className="block rounded-lg border border-border bg-card p-3 hover:bg-secondary">
        <div className="flex items-center gap-3">
          <div className="w-14 text-center">
            <p className="font-semibold">{heureGMT(m.date)}</p>
            <p className="text-[10px] uppercase text-muted-foreground">{m.status}{m.elapsed && m.status !== "FT" ? ` ${m.elapsed}'` : ""}</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
              <img src={m.leagueLogo} alt="" className="h-4 w-4" loading="lazy" />
              {a && a.conf >= 75 && <b className="text-accent">🔥 TOP PRONO · </b>}
              {m.big && "📌 "}{m.league} · {m.country}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-2 font-semibold">
              <img src={m.homeLogo} alt="" className="h-5 w-5" loading="lazy" />{m.home}
              <span className="text-accent">{score}</span>
              {m.away}<img src={m.awayLogo} alt="" className="h-5 w-5" loading="lazy" />
            </p>
          </div>
        </div>
        {a && (a.result || a.safe) && (
          <div className="mt-2 space-y-1 border-t border-border pt-2">
            {a.result && <PickLine title="Prono 1X2" p={a.result} />}
            {a.safe && <PickLine title="Prono safe" p={a.safe} />}
          </div>
        )}
      </Link>
    </li>
  );
}
