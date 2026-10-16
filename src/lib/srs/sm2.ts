import { Card, SRSState } from '../../types';

export function createDefaultSRSState(): SRSState {
  return {
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    nextDueAt: new Date().toISOString(),
    history: [],
  };
}

/**
 * Calculates updated SRSState based on SuperMemo SM-2 algorithm.
 * Rating:
 * 1 = Again (Fail)
 * 2 = Hard
 * 3 = Good
 * 4 = Easy
 */
export function calculateSM2(
  currentState: SRSState = createDefaultSRSState(),
  rating: 1 | 2 | 3 | 4
): SRSState {
  let { interval, repetition, easeFactor } = currentState;
  const now = new Date();

  switch (rating) {
    case 1: // Again
      repetition = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;

    case 2: // Hard
      repetition = repetition + 1;
      interval = Math.max(1, Math.round(interval * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;

    case 3: // Good
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor));
      }
      repetition = repetition + 1;
      break;

    case 4: // Easy
      if (repetition === 0) {
        interval = 3;
      } else if (repetition === 1) {
        interval = 7;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor * 1.3));
      }
      repetition = repetition + 1;
      easeFactor = easeFactor + 0.15;
      break;
  }

  // Calculate next due date
  const nextDueDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  const updatedHistory = [
    ...(currentState.history || []),
    {
      timestamp: now.toISOString(),
      rating,
    },
  ];

  return {
    interval,
    repetition,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextDueAt: nextDueDate.toISOString(),
    lastReviewedAt: now.toISOString(),
    history: updatedHistory.slice(-50), // keep recent 50 reviews
  };
}

export function isCardDue(card: Card, referenceDate: Date = new Date()): boolean {
  if (!card.srsState || !card.srsState.nextDueAt) return true;
  return new Date(card.srsState.nextDueAt).getTime() <= referenceDate.getTime();
}

export function isCardMastered(card: Card): boolean {
  if (!card.srsState) return false;
  return card.srsState.repetition >= 4 || card.srsState.interval >= 21;
}

export function getDaysUntilDue(card: Card): number {
  if (!card.srsState?.nextDueAt) return 0;
  const diffMs = new Date(card.srsState.nextDueAt).getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
