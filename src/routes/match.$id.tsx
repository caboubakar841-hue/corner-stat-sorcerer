import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMatch } from "@/lib/football.functions";
import type { Analysis, Fixture, Market } from "@/lib/football.server";

export const Route = createFileRoute("/match/$id")({
  head: () => ({
    meta: [
      { title: "Détail du match — Prono70" },
      { name: "description", content: "Statistiques, vainqueur probable, score exact probable, buts attendus et confiance du pronostic." },
      { property: "og:title", content: "Détail du match — Prono70" },
      { property: "og:description", content: "Analyse complète d'un match de football par Prono70." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MatchPage,
});

const pct = (p: number) => `${Math.round(p * 100)}%`;

function MatchPage() {
  const { id } = Route.useParams();
  const fn = useServerFn(getMatch);
  const q = useQuery({ queryKey: ["match", id], queryFn: () => fn({ data: { id: Number(id) } }), staleTime: 30 * 60_000 });
  const f = q.data?.fixture as Fixture | null | undefined;
  const a = q.data?.analysis as Analysis | null | undefined;

  return (
    <div className="mx-auto min-h-screen max-w-3xl space-y-6 px-4 py-8 font-sans">
      <Link to="/" className="inline-block rounded-md border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-secondary">← Retour</Link>
      {q.isLoading && <p className="text-muted-foreground">Analyse du match en cours…</p>}
      {q.data?.error && <p className="rounded-md border border-destructive bg-card p-6 text-center text-destructive">{q.data.error}</p>}
      {f && (
        <header className="rounded-lg border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {f.top && "📌 "}{f.country} · {f.league} · {new Date(f.date).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex flex-col items-center gap-2 text-center"><img src={f.homeLogo} alt="" className="h-16 w-16 object-contain" /><span className="font-semibold">{f.home}</span></div>
            <div className="font-display text-5xl text-accent">{f.gh != null ? `${f.gh} - ${f.ga}` : "vs"}</div>
            <div className="flex flex-col items-center gap-2 text-center"><img src={f.awayLogo} alt="" className="h-16 w-16 object-contain" /><span className="font-semibold">{f.away}</span></div>
          </div>
        </header>
      )}
      {f && !a && !q.isLoading && <p className="text-muted-foreground">Pas assez de données pour analyser ce match.</p>}
      {a && <Detail a={a} />}
    </div>
  );
}

function Detail({ a }: { a: Analysis }) {
  const g = (k: Market["group"]) => a.markets.filter((m) => m.group === k);
  const best = a.markets[0];
  const conf = best ? best.prob : 0;
  const level = conf >= 0.8 ? "Élevée" : conf >= 0.7 ? "Bonne" : conf >= 0.55 ? "Moyenne" : "Faible";
  const inf = a.h2hInfluence;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Buts attendus" value={`${a.xgHome.toFixed(1)} – ${a.xgAway.toFixed(1)}`} sub={`${(a.xgHome + a.xgAway).toFixed(2)} au total`} />
        <Stat title="Score exact probable" value={a.exactScore?.score ?? "—"} sub={a.exactScore ? pct(a.exactScore.prob) : ""} />
        <Stat title="Confiance" value={pct(conf)} sub={`${level}${best ? ` · ${best.label}` : ""}`} />
      </div>
      <Section title="Vainqueur probable"><List items={g("winner")} /></Section>
      <Section title="Buts"><List items={g("goals")} /></Section>
      <Section title={`Corners · ${a.xCorners != null ? a.xCorners.toFixed(1) + " attendus" : "données insuffisantes"}`}><List items={g("corners")} /></Section>
      <Section title="Stats · confrontations directes">
        {a.h2h.length === 0 ? <p className="text-sm text-muted-foreground">Aucune confrontation récente.</p> : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {a.home.name} : {inf.homeWins}V · {inf.draws}N · {inf.awayWins}D
              {inf.goalsAvg != null && <> · {inf.goalsAvg.toFixed(1)} buts/match</>}
              {inf.cornersAvg != null && <> · {inf.cornersAvg.toFixed(1)} corners/match</>}
            </p>
            <ul className="space-y-1 text-sm">
              {a.h2h.map((h, i) => (
                <li key={i} className="flex justify-between border-t border-border py-1.5">
                  <span>{new Date(h.date).toLocaleDateString("fr-FR")} · {h.home} – {h.away}</span>
                  <span className="font-bold">{h.score}{h.corners != null && <span className="ml-2 font-normal text-muted-foreground">{h.corners} c.</span>}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>
    </>
  );
}

function Stat({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      <p className="font-display text-4xl text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-2xl tracking-wide text-accent">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: Market[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Aucune donnée.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.label}>
          <div className="flex justify-between text-sm"><span>{it.label}</span><span className="font-bold text-primary">{pct(it.prob)}</span></div>
          <div className="mt-1 h-1.5 rounded bg-muted"><div className="h-1.5 rounded bg-primary" style={{ width: pct(it.prob) }} /></div>
        </li>
      ))}
    </ul>
  );
}
