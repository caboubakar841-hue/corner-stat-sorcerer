// PRONO70 V2 - NO KEY - Real matches ESPN
const PRIORITY: any = {
  "Premier League": 1, "English Premier League": 1,
  "LaLiga": 2, "LALIGA": 2, "Spanish LALIGA": 2,
  "Serie A": 3, "Italian Serie A": 3,
  "Bundesliga": 4, "German Bundesliga": 4,
  "Ligue 1": 5, "French Ligue 1": 5,
  "Champions League": 6, "UEFA Champions League": 6
};
function hash(str: string){ let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))&0xffffffff; return Math.abs(h); }
function makePrediction(home: string, away: string, league: string, date: string){
  const seed=hash(home+away+league+date);
  const r1=(seed%100)/100, r2=((seed*7)%100)/100, r3=((seed*13)%100)/100;
  let homeWinProb=0.53+(r1-0.5)*0.3, drawProb=0.27+(r2-0.5)*0.15, awayWinProb=1-homeWinProb-drawProb;
  let victoire="", conf=55;
  if(homeWinProb>awayWinProb && homeWinProb>drawProb){victoire=`Victoire ${home}`; conf=Math.round(homeWinProb*100);}
  else if(awayWinProb>homeWinProb && awayWinProb>drawProb){victoire=`Victoire ${away}`; conf=Math.round(awayWinProb*100);}
  else{victoire="Match Nul"; conf=Math.round(drawProb*100)+12;}
  conf=Math.min(78,Math.max(52,conf));
  const btts=r2>0.38?"Oui":"Non", over=r3>0.35, buts=over?(r3>0.75?"3-4 buts":"2-3 buts"):"0-2 buts", overLabel=over?"Plus de 2.5":"Moins de 2.5";
  let score="1-1"; if(victoire.includes(home)) score=r1<0.5?"2-1":r1<0.8?"1-0":"2-0"; else if(victoire.includes(away)) score=r2<0.5?"1-2":"0-1"; else score=r3<0.6?"1-1":"0-0";
  const analyse=`Analyse ${league}: ${home} a domicile. Match ${over?'ouvert':'ferme'} - ${btts==='Oui'?'BTTS probable':'Defense solide'}. Score probable ${score}.`;
  return {victoire, confiance:conf, btts, buts:`${overLabel} - ${buts}`, scoreExact:score, analyse};
}
export async function getFixtures(dateStr: string){
  const yyyymmdd=dateStr.replace(/-/g,"");
  const url=`https://site.api.espn.com/apis/site/v2/sports/soccer/all/scoreboard?dates=${yyyymmdd}`;
  const res=await fetch(url); const data=await res.json(); const events=data.events||[];
  events.sort((a:any,b:any)=>{const nameA=a.leagues?.[0]?.name||"",nameB=b.leagues?.[0]?.name||"";const pA=PRIORITY[nameA]||99,pB=PRIORITY[nameB]||99;if(pA!==pB)return pA-pB;return new Date(a.date).getTime()-new Date(b.date).getTime();});
  return events.map((ev:any)=>{const comp=ev.competitions[0];const home=comp.competitors.find((c:any)=>c.homeAway==='home')?.team.displayName||comp.competitors[0].team.displayName;const away=comp.competitors.find((c:any)=>c.homeAway==='away')?.team.displayName||comp.competitors[1].team.displayName;const league=ev.leagues?.[0]?.name||"Autre Ligue";const pred=makePrediction(home,away,league,dateStr);return{id:ev.id,league,home,away,time:ev.date,isTop:(PRIORITY[league]||99)<=5,prediction:pred};});
}
