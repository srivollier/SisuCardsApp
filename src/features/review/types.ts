export type ReviewMode = "weak-first" | "random";
export type ReviewDirection = "fi-fr" | "fr-fi";
export type ReviewResult = "correct" | "incorrect";

export type ReviewStats = {
  reviews_count: number;
  correct_count: number;
  incorrect_count: number;
  streak: number;
  last_reviewed_at: string | null;
};

export type ReviewCard = ReviewStats & {
  card_id: string;
  user_id: string;
  fi: string;
  fr: string | null;
  verb_type?: string | null;
  weaknessScore: number;
};

export type GetReviewQueueInput = {
  mode: ReviewMode;
  limit: number;
};
