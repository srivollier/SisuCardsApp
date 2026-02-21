import { PointerEvent, useRef, useState } from "react";
import {
  getVerbReviewQueue,
  recordVerbReview
} from "../features/review/verbReviewService";
import {
  VerbPronoun,
  VerbReviewCard,
  VerbReviewMode,
  VerbReviewResult,
  VerbTense
} from "../features/review/verbReviewTypes";

const DEFAULT_SESSION_LIMIT = 20;
const SWIPE_THRESHOLD = 120;

const TENSE_LABELS: Record<VerbTense, string> = {
  present: "présent",
  past: "imparfait"
};

const PRONOUN_LABELS: Record<VerbPronoun, string> = {
  mina: "minä",
  sina: "sinä",
  han: "hän",
  me: "me",
  te: "te",
  he: "he"
};

function getErrorMessage(unknownError: unknown, fallback: string): string {
  if (unknownError instanceof Error && unknownError.message) {
    return unknownError.message;
  }
  if (unknownError && typeof unknownError === "object" && "message" in unknownError) {
    const value = (unknownError as { message?: unknown }).message;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return fallback;
}

function getQuestion(card: VerbReviewCard): string {
  const pronounLabel = PRONOUN_LABELS[card.pronoun];
  const tenseLabel = TENSE_LABELS[card.tense];
  return `${card.infinitive_fi} — ${pronounLabel} — ${tenseLabel}`;
}

export function VerbReviewPage() {
  const [mode, setMode] = useState<VerbReviewMode>("weak-first");
  const [sessionLimit, setSessionLimit] = useState(DEFAULT_SESSION_LIMIT);
  const [queue, setQueue] = useState<VerbReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const activePointerId = useRef<number | null>(null);

  const currentCard = currentIndex < queue.length ? queue[currentIndex] : null;
  const sessionFinished = queue.length > 0 && currentCard === null;

  async function loadQueue() {
    setError(null);
    setIsLoading(true);
    try {
      const cards = await getVerbReviewQueue({
        mode,
        limit: sessionLimit
      });
      setQueue(cards);
      setCurrentIndex(0);
      setRevealed(false);
    } catch (unknownError) {
      setError(getErrorMessage(unknownError, "Failed to load queue."));
      setQueue([]);
    } finally {
      setIsLoading(false);
    }
  }

  function advanceCard() {
    setCurrentIndex((value) => value + 1);
    setRevealed(false);
    setDragX(0);
    setIsDragging(false);
    pointerStartX.current = null;
    activePointerId.current = null;
  }

  async function handleReview(result: VerbReviewResult) {
    if (!currentCard || !revealed) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await recordVerbReview(currentCard.verbId, result);
      advanceCard();
    } catch (unknownError) {
      setError(getErrorMessage(unknownError, "Failed to record review."));
    } finally {
      setIsSubmitting(false);
      setDragX(0);
      setIsDragging(false);
      pointerStartX.current = null;
      activePointerId.current = null;
    }
  }

  function resetDrag() {
    setDragX(0);
    setIsDragging(false);
    pointerStartX.current = null;
    activePointerId.current = null;
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!revealed || isSubmitting || !currentCard) {
      return;
    }
    activePointerId.current = event.pointerId;
    pointerStartX.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging || activePointerId.current !== event.pointerId || pointerStartX.current == null) {
      return;
    }
    const delta = event.clientX - pointerStartX.current;
    setDragX(delta);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (activePointerId.current !== event.pointerId || pointerStartX.current == null) {
      return;
    }
    const delta = event.clientX - pointerStartX.current;
    if (Math.abs(delta) >= SWIPE_THRESHOLD && revealed && !isSubmitting) {
      void handleReview(delta > 0 ? "correct" : "incorrect");
      return;
    }
    resetDrag();
  }

  function handleCardClick() {
    if (!revealed && !isSubmitting && currentCard) {
      setRevealed(true);
    }
  }

  const swipeLabel =
    dragX > 24 ? "→ Right = correct" : dragX < -24 ? "← Left = incorrect" : "Swipe left / right";
  const swipeClass =
    dragX > 24 ? "swipe-right" : dragX < -24 ? "swipe-left" : "swipe-neutral";
  const cardTransform = revealed
    ? `translateX(${Math.max(-140, Math.min(140, dragX))}px) rotate(${Math.max(
        -8,
        Math.min(8, dragX / 18)
      )}deg)`
    : "none";

  return (
    <section className="card">
      <h2>Verb review</h2>
      <p className="muted">
        Practice verb conjugations: random tense (présent / imparfait) and pronoun (minä, sinä,
        hän, me, te, he).
      </p>

      <div className="inline-actions review-controls">
        <label>
          Mode
          <select value={mode} onChange={(event) => setMode(event.target.value as VerbReviewMode)}>
            <option value="weak-first">Weak first</option>
            <option value="random">Random</option>
          </select>
        </label>

        <label>
          Session size
          <input
            type="number"
            min={1}
            max={200}
            value={sessionLimit}
            onChange={(event) => {
              const parsed = Number(event.target.value);
              setSessionLimit(Number.isFinite(parsed) ? parsed : DEFAULT_SESSION_LIMIT);
            }}
          />
        </label>

        <button type="button" onClick={() => void loadQueue()} disabled={isLoading}>
          {isLoading ? "Loading..." : queue.length === 0 ? "Start session" : "Restart session"}
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="inline-actions">
        <strong>
          Progress:{" "}
          {queue.length === 0
            ? "0 / 0"
            : `${Math.min(currentIndex + 1, queue.length)} / ${queue.length}`}
        </strong>
      </div>

      {queue.length === 0 && !isLoading ? (
        <p className="muted">No cards in queue yet. Add verbs and click “Start session”.</p>
      ) : null}

      {sessionFinished ? (
        <div className="card subtle-card">
          <h3>Session complete</h3>
          <p>You reviewed {queue.length} card(s).</p>
          <button type="button" onClick={() => void loadQueue()} disabled={isLoading}>
            Start again
          </button>
        </div>
      ) : null}

      {currentCard ? (
        <div
          className="card subtle-card review-card"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onClick={handleCardClick}
          style={{ transform: cardTransform }}
        >
          <p className="muted">Question</p>
          <h3>{getQuestion(currentCard) || "-"}</h3>

          <p className="muted">Answer</p>
          <p className="review-answer">{revealed ? currentCard.answer || "-" : "???"}</p>
          <p className={`review-swipe-hint ${swipeClass}`}>
            {!revealed ? "Tap the card to reveal answer" : swipeLabel}
          </p>

          <div className="inline-actions">
            <button type="button" onClick={() => setRevealed(true)} disabled={revealed || isSubmitting}>
              Show answer
            </button>
            <button type="button" onClick={advanceCard} disabled={isSubmitting}>
              Skip
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
