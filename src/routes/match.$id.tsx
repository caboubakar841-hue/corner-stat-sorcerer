import { createFileRoute, Link } from "@tanstack/react-router";
import { FIXTURES, predict } from "@/data/fixtures";

export const Route = createFileRoute("/match/$id")({
  head: () => ({
    meta: [
      { title: "Détail du match — Prono70" },
      { name: "description", content: "Vainqueur probable, score exact probable, buts attendus et confiance du pronostic." },
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
  const f = FIXTURES.find((x) => x.id === Number(id));
  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 font-sans">
      <Link to="/" className="inline-block rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-secondary">← Retour</Link>
      {!f ? <p className="text-muted-foreground">Match introuvable.</p> : <Detail f={f} />}
    </div>
  );
}

function Detail({ f }: { f: (typeof FIXTURES)[number] }) {
  const p = predict(f);
  return (
    <>
      <header className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">📌 {f.league} · {new Date(f.date).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p>
        <p className="mt-3 font-display text-4xl">{f.home} <span className="text-accent">vs</span> {f.away}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat title="Vainqueur probable" value={p.winner} />
        <Stat title="Score exact probable" value={p.score} />
        <Stat title="Buts attendus" value={`${p.xgHome.toFixed(1)} – ${p.xgAway.toFixed(1)}`} />
        <Stat title="Confiance" value={`${p.confidence}%`} />
      </div>
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 font-display text-2xl text-accent">Stats · 5 derniers résultats (fictifs)</h2>
        {[[f.home, p.formHome], [f.away, p.formAway]].map(([name, form]) => (
          <p key={name as string} className="text-sm"><b>{name as string}</b> : {(form as [number, number][]).map((r) => `${r[0]}-${r[1]}`).join(" · ")}</p>
        ))}
      </section>
    </>
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
