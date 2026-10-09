import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getPredictions } from "@/lib/football.functions";
import type { Analysis, Market, Fixture } from "@/lib/football.server";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Prono70 — Pronostics football à plus de 70%" },
      { name: "description", content: "Buts, vainqueur probable et corners calculés à partir de données réelles et des confrontations directes. Seulement les pronostics à 70% et plus." },
      { property: "og:title", content: "Prono70 — Pronostics football à plus de 70%" },
      { property: "og:description", content: "Buts, vainqueur et corners, uniquement à 70% de probabilité ou plus." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const CATS = [
  { id: "top5", label: "Top 5 européens" },
  { id: "europe", label: "Coupes d'Europe" },
  { id: "afrique", label: "Afrique" },
  { id: "tous", label: "Tous" },
] as const;

const pct = (p: number) => `${Math.round(p * 100)}%`;

function Index() {
  const [date, setDate] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]["id"]>("tous");
  useEffect(() => setDate(new Date().toISOString().slice(0, 10)), []);
  const fn = useServerFn(getPredictions);
  const q = useQuery({
    queryKey: ["preds", date, cat],
    queryFn: () => fn({ data: { date, category: cat } }),
    enabled: !!date,
    staleTime: 30 * 60_000,
  });

  // Si le chargement dépasse 60 s, afficher un message d'erreur explicite
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!q.isLoading) return;
    const t = setTimeout(() => setSlow(true), 60_000);
    return () => clearTimeout(t);
  }, [q.isLoading, q.dataUpdatedAt, date, cat]);

  return (
    <div className="min-h-screen font-sans">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-sm uppercase tracking-widest text-accent">Données réelles · seuil 70%</p>
          <h1 className="font-display text-6xl leading-none text-primary md:text-8xl">Prono70</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Estimation des buts, du vainqueur probable et des corners. Seuls les pronostics avec au moins 70% de chance sont affichés.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-input bg-card px-3 py-2 text-foreground"
            />
            {CATS.map((c) => (
              <button
                key={c.id} onClick={() => setCat(c.id)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${cat === c.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}
              >{c.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        {q.isLoading && !slow && (
          <p className="text-muted-foreground">Analyse des matchs en cours… (cela peut prendre jusqu'à une minute)</p>
        )}
        {q.isLoading && slow && (
          <div className="rounded-md border border-destructive bg-card p-6 text-center">
            <p className="font-semibold text-destructive">Le chargement est plus long que prévu.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les matchs ne se sont pas affichés après une minute. Le service de données est peut-être saturé ou votre quota de requêtes du jour est atteint.
            </p>
            <button
              onClick={() => { setSlow(false); q.refetch(); }}
              className="mt-4 rounded-md border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Relancer le chargement
            </button>
          </div>
        )}
        {!q.isLoading && (q.data?.error || q.isError) && (
          <div className="rounded-md border border-destructive bg-card p-6 text-center">
            <p className="text-destructive">{q.data?.error ?? "Une erreur est survenue pendant le chargement des matchs."}</p>
            <button
              onClick={() => { setSlow(false); q.refetch(); }}
              className="mt-4 rounded-md border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Relancer le chargement
            </button>
          </div>
        )}
        {q.data && !q.data.error && (
          <p className="text-sm text-muted-foreground">
            {q.data.analyzed} match(s) analysé(s) · {q.data.matches.length} avec au moins un pronostic ≥ 70%
          </p>
        )}
        {q.data && !q.data.error && q.data.matches.length === 0 && (
          <p className="rounded-md border border-border bg-card p-6 text-center text-muted-foreground">
            Aucun pronostic n'atteint 70% pour cette sélection. Essayez une autre date ou un autre championnat.
          </p>
        )}
        {q.data?.matches.map((m) => <MatchCard key={m.id} m={m as Analysis} />)}
        {q.data && !q.data.error && <FixtureList title="Tous les matchs du jour" items={(q.data.fixtures as Fixture[]).filter((f) => !FINISHED.includes(f.status))} />}
        {q.data && !q.data.error && <FixtureList title="Historique · matchs terminés" items={(q.data.fixtures as Fixture[]).filter((f) => FINISHED.includes(f.status))} />}
      </main>
    </div>
  );
}

const FINISHED = ["FT", "AET", "PEN"];
const sofa = (h: string, a: string) => `https://www.google.com/search?q=${encodeURIComponent(`sofascore ${h} vs ${a}`)}&btnI=1`;

function SofaLink({ h, a }: { h: string; a: string }) {
  return <a href={sofa(h, a)} target="_blank" rel="noreferrer" className="rounded border border-accent px-2 py-0.5 text-xs font-semibold text-accent hover:bg-accent hover:text-accent-foreground">Sofascore ↗</a>;
}

function FixtureList({ title, items }: { title: string; items: Fixture[] }) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 font-display text-3xl tracking-wide text-primary">{title} ({items.length})</h2>
      {items.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Aucun match.</p> : (
        <ul>
          {items.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-2 text-sm first:border-t-0">
              <span className="w-12 text-muted-foreground">{new Date(f.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="min-w-0 flex-1"><span className="font-semibold">{f.home}</span>{" "}<span className="font-bold text-accent">{f.gh != null ? `${f.gh} - ${f.ga}` : "vs"}</span>{" "}<span className="font-semibold">{f.away}</span><span className="block text-xs text-muted-foreground">{f.country} · {f.league} · {f.status}</span></span>
              <SofaLink h={f.home} a={f.away} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MarketList({ items }: { items: Market[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Aucun pronostic ≥ 70%</p>;
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

function MatchCard({ m }: { m: Analysis }) {
  const g = (k: Market["group"]) => m.markets.filter((x) => x.group === k);
  const time = new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const inf = m.h2hInfluence;
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground">
        <img src={m.leagueLogo} alt="" className="h-4 w-4" /> {m.country} · {m.league} · {time}<span className="ml-auto normal-case"><SofaLink h={m.home.name} a={m.away.name} /></span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-5">
        <Team name={m.home.name} logo={m.home.logo} />
        <div className="text-center">
          <div className="font-display text-4xl text-accent">{m.xgHome.toFixed(1)} – {m.xgAway.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">buts attendus</div>
        </div>
        <Team name={m.away.name} logo={m.away.logo} right />
      </div>

      <div className="grid gap-4 border-t border-border p-4 md:grid-cols-3">
        <Block title="Vainqueur probable"><MarketList items={g("winner")} /></Block>
        <Block title={`Buts · ${(m.xgHome + m.xgAway).toFixed(2)} attendus`}><MarketList items={g("goals")} /></Block>
        <Block title={`Corners · ${m.xCorners != null ? m.xCorners.toFixed(1) + " attendus" : "données insuffisantes"}`}><MarketList items={g("corners")} /></Block>
      </div>

      <div className="border-t border-border bg-secondary/40 p-4">
        <h3 className="font-display text-2xl tracking-wide">Confrontations directes</h3>
        {m.h2h.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune confrontation récente — estimations basées uniquement sur la forme.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              {m.home.name} : {inf.homeWins}V · {inf.draws}N · {inf.awayWins}D sur {m.h2h.length} matchs
              {inf.goalsAvg != null && <> · {inf.goalsAvg.toFixed(1)} buts/match</>}
              {inf.cornersAvg != null && <> · {inf.cornersAvg.toFixed(1)} corners/match</>}
              . Influence sur les estimations : <span className="font-semibold text-accent">{Math.round(inf.weight * 100)}%</span> (buts et vainqueur), 100% (corners).
            </p>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-1">Date</th><th>Match</th><th className="text-center">Score</th><th className="text-right">Corners</th></tr>
              </thead>
              <tbody>
                {m.h2h.map((h, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1.5">{new Date(h.date).toLocaleDateString("fr-FR")}</td>
                    <td>{h.home} – {h.away} <SofaLink h={h.home} a={h.away} /></td>
                    <td className="text-center font-bold">{h.score}</td>
                    <td className="text-right">{h.corners ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </article>
  );
}

function Team({ name, logo, right }: { name: string; logo: string; right?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${right ? "flex-row-reverse text-right" : ""}`}>
      <img src={logo} alt="" className="h-10 w-10 object-contain" />
      <span className="font-semibold">{name}</span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 font-display text-xl tracking-wide text-accent">{title}</h3>
      {children}
    </section>
  );
}
