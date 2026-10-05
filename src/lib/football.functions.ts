import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeDay } from "./football.server";

export const getPredictions = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      category: z.enum(["top5", "europe", "afrique", "tous"]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env["API_FOOTBALL_KEY"];
    if (!key) return { error: "Clé API-Football manquante.", analyzed: 0, total: 0, matches: [] };
    try {
      return { error: null, ...(await analyzeDay(data.date, data.category, 10, key)) };
    } catch (e) {
      console.error(e);
      return { error: (e as Error).message, analyzed: 0, total: 0, matches: [] };
    }
  });
