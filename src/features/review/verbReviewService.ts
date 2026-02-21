import { supabase } from "../../lib/supabaseClient";
import {
  conjugationColumn,
  GetVerbReviewQueueInput,
  VerbPronoun,
  VerbReviewCard,
  VerbReviewStats,
  VerbTense
} from "./verbReviewTypes";

const PRONOUNS: VerbPronoun[] = ["mina", "sina", "han", "me", "te", "he"];
const TENSES: VerbTense[] = ["present", "past"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function daysSince(lastReviewedAt: string | null): number {
  if (!lastReviewedAt) {
    return 28;
  }
  const millis = Date.now() - new Date(lastReviewedAt).getTime();
  return millis <= 0 ? 0 : millis / (1000 * 60 * 60 * 24);
}

export function computeVerbWeaknessScore(stats: VerbReviewStats): number {
  const base = (stats.incorrect_count + 1) / (stats.correct_count + 1);
  const recency = clamp(daysSince(stats.last_reviewed_at) / 7, 0, 4);
  const newBonus = stats.reviews_count === 0 ? 2 : 0;
  return base + recency + newBonus;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const tmp = next[index];
    next[index] = next[randomIndex];
    next[randomIndex] = tmp;
  }
  return next;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type RawVerb = {
  id: string;
  infinitive_fi: string;
  fr: string | null;
  present_mina: string | null;
  present_sina: string | null;
  present_han: string | null;
  present_me: string | null;
  present_te: string | null;
  present_he: string | null;
  past_mina: string | null;
  past_sina: string | null;
  past_han: string | null;
  past_me: string | null;
  past_te: string | null;
  past_he: string | null;
};

type RawVerbReviewStat = {
  verb_id: string;
  reviews_count: number;
  correct_count: number;
  incorrect_count: number;
  streak: number;
  last_reviewed_at: string | null;
};

function getConjugation(verb: RawVerb, tense: VerbTense, pronoun: VerbPronoun): string {
  const key = conjugationColumn(tense, pronoun);
  const value = (verb as Record<string, unknown>)[key];
  return value != null && value !== "" ? String(value) : "";
}

export async function getVerbReviewQueue(
  input: GetVerbReviewQueueInput
): Promise<VerbReviewCard[]> {
  const safeLimit = Number.isFinite(input.limit) ? Math.max(1, Math.floor(input.limit)) : 20;

  const { data: verbs, error: verbsError } = await supabase
    .from("verbs")
    .select(
      "id,infinitive_fi,fr,present_mina,present_sina,present_han,present_me,present_te,present_he,past_mina,past_sina,past_han,past_me,past_te,past_he"
    );

  if (verbsError) {
    throw verbsError;
  }

  if (!verbs || verbs.length === 0) {
    return [];
  }

  const verbIds = verbs.map((v) => String((v as Record<string, unknown>).id));
  const { data: statsRows, error: statsError } = await supabase
    .from("verb_review_stats")
    .select("verb_id,reviews_count,correct_count,incorrect_count,streak,last_reviewed_at")
    .in("verb_id", verbIds);

  if (statsError) {
    throw statsError;
  }

  const statsByVerbId = new Map<string, VerbReviewStats>();
  (statsRows ?? []).forEach((row) => {
    const r = row as RawVerbReviewStat;
    const verbId = String(r.verb_id ?? "");
    if (verbId) {
      statsByVerbId.set(verbId, {
        reviews_count: r.reviews_count ?? 0,
        correct_count: r.correct_count ?? 0,
        incorrect_count: r.incorrect_count ?? 0,
        streak: r.streak ?? 0,
        last_reviewed_at: r.last_reviewed_at ? String(r.last_reviewed_at) : null
      });
    }
  });

  const cardsWithScores: { card: VerbReviewCard; score: number }[] = [];

  for (const v of verbs as RawVerb[]) {
    const verbId = String(v.id);
    const stats: VerbReviewStats = statsByVerbId.get(verbId) ?? {
      reviews_count: 0,
      correct_count: 0,
      incorrect_count: 0,
      streak: 0,
      last_reviewed_at: null
    };
    const weaknessScore = computeVerbWeaknessScore(stats);

    const tense = pickRandom(TENSES);
    const pronoun = pickRandom(PRONOUNS);
    const answer = getConjugation(v, tense, pronoun);

    if (answer === "") {
      continue;
    }

    cardsWithScores.push({
      card: {
        verbId,
        infinitive_fi: v.infinitive_fi ?? "",
        fr: v.fr ?? null,
        tense,
        pronoun,
        answer,
        weaknessScore
      },
      score: weaknessScore
    });
  }

  const ordered =
    input.mode === "weak-first"
      ? cardsWithScores.sort((a, b) => b.score - a.score)
      : shuffle(cardsWithScores);

  return ordered.slice(0, safeLimit).map((x) => x.card);
}

export async function recordVerbReview(
  verbId: string,
  result: "correct" | "incorrect"
): Promise<void> {
  const { error } = await supabase.rpc("record_verb_review", {
    p_verb_id: verbId,
    p_result: result
  });

  if (error) {
    throw error;
  }
}
