import type { Analysis, Pick } from "@/lib/fixtures.functions";

const KEY = "prono70-analyses";

export function loadSaved(): Record<number, Analysis> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
export function saveAnalyses(a: Record<number, Analysis>) {
  try { localStorage.setItem(KEY, JSON.stringify(a)); } catch { /* ignore */ }
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

export function Picks({ a }: { a: Analysis }) {
  if (!(a.result || a.safe || a.exact || a.btts)) return null;
  return (
    <div className="space-y-1">
      {a.result && <PickLine title="Prono 1X2" p={a.result} />}
      {a.safe && <PickLine title="Prono safe" p={a.safe} />}
      {a.btts && <PickLine title="BTTS" p={a.btts} />}
      {a.exact && (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs uppercase text-muted-foreground">Score exact</span>
          <b className="text-accent">{a.exact.label}</b>
          <span className="text-xs text-muted-foreground">({a.exact.pct}%)</span>
        </p>
      )}
    </div>
  );
}
