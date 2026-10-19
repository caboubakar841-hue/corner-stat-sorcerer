// PRONO70 V2 - FIX
const PRIORITY: any = {
  "Premier League": 1, "English Premier League": 1,
  "LaLiga": 2, "LALIGA": 2, "Spanish LALIGA": 2,
  "Serie A": 3, "Italian Serie A": 3,
  "Bundesliga": 4, "German Bundesliga": 4,
  "Ligue 1": 5, "French Ligue 1": 5,
  "Champions League": 6, "UEFA Champions League": 6
};

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

export async function getFixtures(dateStr: string) {
  try {
    const yyyymmdd = dateStr.replace(/-/g, "");
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${yyyymmdd}`;
    const res = await fetch(url);
    const data = await res.json();
    const events = data.events || [];

    events.sort((a: any, b: any) => {
      const nameA = a.leagues?.[0]?.name || "";
      const nameB = b.leagues?.[0]?.name || "";
      const pA = PRIORITY[nameA] || 99;
      const pB = PRIORITY[nameB] || 99;
      if (pA !== pB) return pA - pB;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return events.map((ev: any) => {
      const comp = ev.competitions[0];
      const homeTeam = comp.competitors.find((c: any) => c.homeAway === 'home')?.team.displayName || comp.competitors[0].team.displayName;
      const awayTeam = comp.competitors.find((c: any) => c.homeAway === 'away')?.team.displayName || comp.competitors[1].team.displayName;
      const league = ev.leagues?.[0]?.name || "Autre Ligue";
      
      const seed = hash(homeTeam + awayTeam + league + dateStr);
      const r1 = (seed % 100) / 100;
      const r2 = ((seed * 7) % 100) / 100;
      const r3 = ((seed * 13) % 100) / 100;

      let victoire = "";
      if (r1 > 0.55) victoire = `Victoire ${homeTeam}`;
      else if (r1 < 0.35) victoire = `Victoire ${awayTeam}`;
      else victoire = "Match Nul";

      const btts = r2 > 0.38 ? "Oui" : "Non";
      const over = r3 > 0.35 ? "Plus de 2.5" : "Moins de 2.5";
      const buts = r3 > 0.75 ? "3-4 buts" : r3 > 0.35 ? "2-3 buts" : "0-2 buts";
      let score = "1-1";
      if (victoire.includes(homeTeam)) score = r1 < 0.7 ? "2-1" : "1-0";
      else if (victoire.includes(awayTeam)) score = "1-2";
      
      return {
        id: ev.id,
        league,
        home: homeTeam,
        away: awayTeam,
        time: ev.date,
        isTop: (PRIORITY[league] || 99) <= 5,
        prediction: {
          victoire,
          confiance: Math.min(78, Math.max(52, Math.round(r1 * 50 + 40))),
          btts,
          buts: `${over} - ${buts}`,
          scoreExact: score,
          analyse: `Analyse ${league}: ${homeTeam} a domicile. Match ${over.includes('Plus') ? 'ouvert' : 'ferme'}. Score probable ${score}.`
        }
      };
    });
  } catch (e) {
    console.error(e);
    return [];
  }
}
