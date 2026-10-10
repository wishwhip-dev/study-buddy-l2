/**
 * This application's database.
 *
 * The reusable half of the setup is in `lib/storage/` and is not edited. This file is the half
 * that describes the product: which tables exist, what is indexed, and how the schema has changed
 * over time.
 */
import { defineDatabase } from "@/lib/storage/database";

/** One multiple-choice question as the model returned it and the quiz played it. */
export type QuizQuestion = {
  question: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
};

/** A finished quiz, kept so it can be replayed as a read-only review. */
export type Quiz = {
  id: string;
  /** Taken from the notes' first line. */
  title: string;
  /** Epoch millis. Indexed, because the list is ordered by it. */
  createdAt: number;
  /** How many of `questions` were answered correctly. */
  score: number;
  total: number;
  questions: QuizQuestion[];
  /** The option chosen for each question, in question order. */
  answers: number[];
};

/** Ids are generated here so the data layer never depends on an auto-increment round trip. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const database = defineDatabase<{ quizzes: Quiz }>({
  // Part of the origin's storage identity. Renaming it does not migrate anything — it points the
  // application at a different, empty database and abandons the old one in place.
  name: "study-buddy",
  versions: [
    // Only the primary key and the property the list is ordered by. `title` and `score` are stored
    // but never filtered or sorted by, so indexing them would cost writes and buy nothing.
    { version: 1, stores: { quizzes: "id, createdAt" } },
  ],
});
