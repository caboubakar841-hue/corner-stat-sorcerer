import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getFixture, getPrediction, type Analysis } from "@/lib/fixtures.functions";
import { Picks, loadSaved, saveAnalyses } from "@/components/Picks";

export const Route = createFileRoute("/match/$id")({
  head: () => ({
    meta: [
      { title: "Détail du match — Prono70" },
      { name: "description", content: "Heure, statut, équipes et pronostics du match." },
      { property: "og:title", content: "Détail du match — Prono70" },
      { property: "og:description", content: "Détail et pronostics d'un match de football sur Prono70." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MatchPage,
});

function MatchPage() {
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["fixture", id], queryFn: () => getFixture({ data: { id } }) });
  const m = q.data;
  const [a, setA] = useState<Analysis | null>(null);
  const [loadingA, setLoadingA] = useState(true);

  useEffect(() => {
    const saved = loadSaved();
    const s = saved[Number(id)];
    if (s) { setA(s); setLoadingA(false); return; }
    getPrediction({ data: { id } })
      .then((r) => { setA(r); saveAnalyses({ ...loadSaved(), [r.id]: r }); })
      .catch(() => setA(null))
      .finally(() => setLoadingA(false));
  }, [id]);

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 font-sans">
      <Link to="/" className="inline-block rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-secondary">← Retour</Link>
      {q.isLoading ? <p>Chargement…</p> : q.isError ? <p>Erreur : {(q.error as Error).message}</p> : !m ? (
        <p className="text-muted-foreground">Match introuvable.</p>
      ) : (
        <header className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="flex items-center justify-center gap-2 text-xs uppercase text-muted-foreground">
            <img src={m.leagueLogo} alt="" className="h-5 w-5" />{m.league} · {m.country}
          </p>
          <p className="mt-2 text-sm">⏰ {new Date(m.date).toISOString().slice(11, 16)} GMT · {m.statusLong}{m.elapsed ? ` ${m.elapsed}'` : ""}</p>
          <div className="mt-4 flex items-center justify-center gap-4 font-display text-3xl">
            <span className="flex flex-col items-center gap-2"><img src={m.homeLogo} alt="" className="h-14 w-14" />{m.home}</span>
            <span className="text-accent">{m.goalsHome != null ? `${m.goalsHome}-${m.goalsAway}` : "vs"}</span>
            <span className="flex flex-col items-center gap-2"><img src={m.awayLogo} alt="" className="h-14 w-14" />{m.away}</span>
          </div>
        </header>
      )}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-3 font-display text-2xl text-accent">Pronostics d'avant-match</h2>
        {loadingA ? <p className="animate-pulse text-sm">Analyse en cours…</p>
          : a && (a.result || a.safe || a.exact || a.btts) ? <Picks a={a} />
          : <p className="text-sm text-muted-foreground">Aucun pronostic fiable disponible pour ce match.</p>}
      </section>
    </div>
  );
}
