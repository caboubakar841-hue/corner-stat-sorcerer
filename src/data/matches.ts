export type Match = {
  id: number;
  jour: "aujourdhui" | "demain" | "apresdemain";
  heure: string;
  league: string;
  home: string;
  away: string;
  prono: string;
  score: string;
  confiance: number;
};

export const matches: Match[] = [
  // AUJOURD'HUI 10 octobre
  { id: 1, jour: "aujourdhui", heure: "15:00", league: "Premier League", home: "Arsenal", away: "Man City", prono: "1X", score: "2-1", confiance: 78 },
  { id: 2, jour: "aujourdhui", heure: "17:30", league: "Premier League", home: "Liverpool", away: "Chelsea", prono: "1", score: "2-0", confiance: 82 },
  { id: 3, jour: "aujourdhui", heure: "20:45", league: "La Liga", home: "Real Madrid", away: "Atletico", prono: "1", score: "2-1", confiance: 75 },
  { id: 4, jour: "aujourdhui", heure: "20:45", league: "Serie A", home: "Inter", away: "Roma", prono: "1X", score: "1-1", confiance: 65 },
  // DEMAIN 11 octobre
  { id: 5, jour: "demain", heure: "15:00", league: "Bundesliga", home: "Bayern", away: "Leverkusen", prono: "1", score: "3-1", confiance: 80 },
  { id: 6, jour: "demain", heure: "17:30", league: "Ligue 1", home: "PSG", away: "Lyon", prono: "1", score: "2-0", confiance: 85 },
  { id: 7, jour: "demain", heure: "20:45", league: "La Liga", home: "Barcelone", away: "Seville", prono: "1", score: "3-0", confiance: 88 },
  // APRES-DEMAIN 12 octobre
  { id: 8, jour: "apresdemain", heure: "15:00", league: "Premier League", home: "Man Utd", away: "Tottenham", prono: "X2", score: "1-2", confiance: 70 },
  { id: 9, jour: "apresdemain", heure: "18:00", league: "Serie A", home: "Juventus", away: "Napoli", prono: "1X", score: "1-0", confiance: 68 },
];

export const findMatch = (id: string) => matches.find((m) => m.id === Number(id));
