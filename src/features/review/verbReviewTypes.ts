export type VerbReviewMode = "weak-first" | "random";
export type VerbReviewResult = "correct" | "incorrect";

export type VerbPronoun = "mina" | "sina" | "han" | "me" | "te" | "he";
export type VerbTense = "present" | "past";

export type VerbReviewStats = {
  reviews_count: number;
  correct_count: number;
  incorrect_count: number;
  streak: number;
  last_reviewed_at: string | null;
};

export type VerbReviewCard = {
  verbId: string;
  infinitive_fi: string;
  fr: string | null;
  tense: VerbTense;
  pronoun: VerbPronoun;
  answer: string;
  weaknessScore: number;
};

export type GetVerbReviewQueueInput = {
  mode: VerbReviewMode;
  limit: number;
};

/** Conjugation column name on verbs table, e.g. present_mina, past_he */
export function conjugationColumn(tense: VerbTense, pronoun: VerbPronoun): string {
  return `${tense}_${pronoun}`;
}
