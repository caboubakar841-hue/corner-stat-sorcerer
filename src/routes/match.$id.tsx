import { createFileRoute, Link } from "@tanstack/react-router";
import { findMatch } from "@/data/matches";

export const Route = createFileRoute("/match/$id")({
  head: () => ({
    meta: [
      { title: "Détail du match — Prono70" },
      { name: "description", content: "Prono, score exact probable et confiance du match." },
      { property: "og:title", content: "Détail du match — Prono70" },
      { property: "og:description", content: "Analyse complète d'un match de football par Prono70." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MatchPage,
});

function MatchPage() {
  const { id } = Route.useParams();
  const m = findMatch(id);
  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 font-sans">
      <Link to="/" className="inline-block rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-secondary">← Retour</Link>
      {!m ? (
        <p className="text-muted-foreground">Match introuvable.</p>
      ) : (
        <>
          <header className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">⏰ {m.heure} · {m.league}</p>
            <p className="mt-3 font-display text-4xl">{m.home} <span className="text-accent">vs</span> {m.away}</p>
          </header>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat title="Prono" value={m.prono} />
            <Stat title="Score probable" value={m.score} />
            <Stat title="Confiance" value={`${m.confiance}%`} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="font-display text-3xl text-primary">{value}</p>
    </div>
  );
}
