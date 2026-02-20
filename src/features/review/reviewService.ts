import { supabase } from "../../lib/supabaseClient";
import { GetReviewQueueInput, ReviewCard, ReviewResult, ReviewStats } from "./types";

type RawReviewCard = {
  card_id: string;
  user_id: string;
  fi: string;
  fr: string | null;
  reviews_count: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  streak: number | null;
  last_reviewed_at: string | null;
};

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

function normalizeCard(raw: RawReviewCard): ReviewCard {
  const stats: ReviewStats = {
    reviews_count: raw.reviews_count ?? 0,
    correct_count: raw.correct_count ?? 0,
    incorrect_count: raw.incorrect_count ?? 0,
    streak: raw.streak ?? 0,
    last_reviewed_at: raw.last_reviewed_at
  };

  return {
    card_id: raw.card_id,
    user_id: raw.user_id,
    fi: raw.fi,
    fr: raw.fr,
    ...stats,
    weaknessScore: computeWeaknessScore(stats)
  };
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

export function computeWeaknessScore(stats: ReviewStats): number {
  const base = (stats.incorrect_count + 1) / (stats.correct_count + 1);
  const recency = clamp(daysSince(stats.last_reviewed_at) / 7, 0, 4);
  const newBonus = stats.reviews_count === 0 ? 2 : 0;
  return base + recency + newBonus;
}

export async function getReviewQueue(input: GetReviewQueueInput): Promise<ReviewCard[]> {
  const safeLimit = Number.isFinite(input.limit) ? Math.max(1, Math.floor(input.limit)) : 20;

  const { data: words, error: wordsError } = await supabase.from("words").select("id,user_id,fi,fr");

  if (wordsError) {
    throw wordsError;
  }

  if (!words || words.length === 0) {
    return [];
  }

  const wordIds = words.map((word) => String((word as Record<string, unknown>).id));
  const { data: stats, error: statsError } = await supabase
    .from("review_stats")
    .select("card_id,reviews_count,correct_count,incorrect_count,streak,last_reviewed_at")
    .in("card_id", wordIds);

  if (statsError) {
    throw statsError;
  }

  const statsByCardId = new Map<string, Record<string, unknown>>();
  (stats ?? []).forEach((entry) => {
    const cardId = String((entry as Record<string, unknown>).card_id ?? "");
    if (cardId) {
      statsByCardId.set(cardId, entry as Record<string, unknown>);
    }
  });

  const cards = words.map((word) => {
    const base = word as Record<string, unknown>;
    const cardId = String(base.id ?? "");
    const stat = statsByCardId.get(cardId);
    const row: RawReviewCard = {
      card_id: cardId,
      user_id: String(base.user_id ?? ""),
      fi: String(base.fi ?? ""),
      fr: base.fr == null ? null : String(base.fr),
      reviews_count: stat ? Number(stat.reviews_count ?? 0) : 0,
      correct_count: stat ? Number(stat.correct_count ?? 0) : 0,
      incorrect_count: stat ? Number(stat.incorrect_count ?? 0) : 0,
      streak: stat ? Number(stat.streak ?? 0) : 0,
      last_reviewed_at: stat && stat.last_reviewed_at ? String(stat.last_reviewed_at) : null
    };
    return normalizeCard(row);
  });

  const ordered =
    input.mode === "weak-first"
      ? cards.sort((a, b) => b.weaknessScore - a.weaknessScore)
      : shuffle(cards);

  return ordered.slice(0, safeLimit);
}

export async function recordReview(cardId: string, result: ReviewResult): Promise<void> {
  const { error } = await supabase.rpc("record_review", {
    p_card_id: cardId,
    p_result: result
  });

  if (error) {
    throw error;
  }
}
