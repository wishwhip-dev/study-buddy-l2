"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { QuizForm } from "@/components/quiz/quiz-form";
import { QuizList } from "@/components/quiz/quiz-list";
import { QuizResults } from "@/components/quiz/quiz-results";
import { QuizReview } from "@/components/quiz/quiz-review";
import { QuizRun } from "@/components/quiz/quiz-run";
import { askModel } from "@/lib/ai";
import { database, newId, type Quiz, type QuizQuestion } from "@/lib/db";
import { saveQuiz } from "@/lib/data/quizzes";
import { SAMPLE_NOTES } from "@/lib/sample-notes";
import { useStorageStatus } from "@/lib/storage/react";

type Screen =
  | { kind: "form" }
  | { kind: "quiz"; questions: QuizQuestion[]; title: string }
  | { kind: "results" }
  | { kind: "review"; id: string };

/** Notes longer than this are trimmed for the prompt; the model works best on the early material. */
const MAX_NOTES_CHARS = 6_000;

const QUIZ_EXAMPLE = {
  questions: [
    {
      question: "Which gas do plants release as a waste product of photosynthesis?",
      options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
      correctIndex: 1,
    },
  ],
};

const SYSTEM_PROMPT =
  "You write study quizzes from a student's class notes. Answer only with JSON in the example's " +
  "shape: exactly five questions, each with a question string, an options array of four strings " +
  "and correctIndex, the zero-based position of the one right answer. Use only facts that appear " +
  "in the notes, make the wrong options plausible, and keep every question answerable on its own.";

/** The first line of the notes becomes the quiz's title. */
function titleFromNotes(notes: string): string {
  const firstLine = notes
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) return "Class notes quiz";
  return firstLine.length > 80 ? `${firstLine.slice(0, 79)}…` : firstLine;
}

/** Checks the model's answer: exactly five complete questions, or nothing. */
function parseQuestions(data: unknown): QuizQuestion[] | null {
  if (!data || typeof data !== "object") return null;
  const raw = (data as { questions?: unknown }).questions;
  if (!Array.isArray(raw)) return null;
  const questions: QuizQuestion[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const entry = item as Record<string, unknown>;
    const options = entry.options;
    if (typeof entry.question !== "string" || !entry.question.trim()) return null;
    if (!Array.isArray(options) || options.length !== 4) return null;
    if (!options.every((option) => typeof option === "string" && option.trim().length > 0)) return null;
    if (
      typeof entry.correctIndex !== "number" ||
      !Number.isInteger(entry.correctIndex) ||
      entry.correctIndex < 0 ||
      entry.correctIndex > 3
    ) {
      return null;
    }
    questions.push({
      question: entry.question,
      options: options as string[],
      correctIndex: entry.correctIndex,
    });
    if (questions.length === 5) break;
  }
  return questions.length === 5 ? questions : null;
}

export function QuizMaker() {
  const [notes, setNotes] = useState("");
  const [screen, setScreen] = useState<Screen>({ kind: "form" });
  const [validation, setValidation] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [finished, setFinished] = useState<Quiz | null>(null);
  const storageStatus = useStorageStatus(database);

  const makeQuiz = useCallback(async () => {
    const trimmed = notes.trim();
    if (!trimmed) {
      setValidation("Paste some notes first — the quiz is made from them.");
      return;
    }
    setValidation(null);
    setProblem(null);
    setWorking(true);
    try {
      const result = await askModel(
        `Make exactly five multiple-choice quiz questions from these class notes.\n\n${trimmed.slice(0, MAX_NOTES_CHARS)}`,
        { system: SYSTEM_PROMPT, json: true, example: QUIZ_EXAMPLE, maxTokens: 1000, temperature: 0.4 },
      );
      if (!result.ok) {
        setProblem(result.message);
        return;
      }
      const questions = parseQuestions(result.data);
      if (!questions) {
        setProblem(
          "The assistant couldn't make five questions from these notes. Try again, or paste longer notes with more facts in them.",
        );
        return;
      }
      setScreen({ kind: "quiz", questions, title: titleFromNotes(trimmed) });
    } catch (error) {
      setProblem(error instanceof Error ? error.message : "The assistant isn't available right now.");
    } finally {
      setWorking(false);
    }
  }, [notes]);

  const handleDone = useCallback(
    async (answers: number[]) => {
      if (screen.kind !== "quiz") return;
      const { questions, title } = screen;
      const score = questions.reduce(
        (count, question, index) => count + (answers[index] === question.correctIndex ? 1 : 0),
        0,
      );
      const quiz: Quiz = {
        id: newId(),
        title,
        createdAt: Date.now(),
        score,
        total: questions.length,
        questions,
        answers,
      };
      try {
        await saveQuiz(quiz);
      } catch (error) {
        toast.error("The quiz could not be saved.", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
      setFinished(quiz);
      setScreen({ kind: "results" });
    },
    [screen],
  );

  const makeAnother = useCallback(() => {
    setNotes("");
    setFinished(null);
    setValidation(null);
    setProblem(null);
    setScreen({ kind: "form" });
  }, []);

  return (
    <div className="space-y-8">
      {storageStatus === "memory" && (
        <Alert>
          <AlertTitle>This browser will not keep your data</AlertTitle>
          <AlertDescription>
            Quizzes you finish will disappear when this tab closes. Export them to a file if you
            want to keep them.
          </AlertDescription>
        </Alert>
      )}

      {screen.kind === "form" && (
        <>
          <section aria-label="Make a quiz">
            <QuizForm
              notes={notes}
              onNotesChange={setNotes}
              onSubmit={makeQuiz}
              onSample={() => setNotes(SAMPLE_NOTES)}
              validation={validation}
              problem={problem}
              onTryAgain={makeQuiz}
              busy={working}
            />
          </section>
          <QuizList onOpen={(id) => setScreen({ kind: "review", id })} />
        </>
      )}

      {screen.kind === "quiz" && (
        <section aria-label="Quiz in progress">
          <QuizRun
            questions={screen.questions}
            notes={notes}
            title={screen.title}
            onDone={handleDone}
          />
        </section>
      )}

      {screen.kind === "results" && finished && (
        <section aria-label="Quiz results">
          <QuizResults
            title={finished.title}
            questions={finished.questions}
            answers={finished.answers}
            score={finished.score}
            onMakeAnother={makeAnother}
          />
        </section>
      )}

      {screen.kind === "review" && (
        <section aria-label="Review a past quiz">
          <QuizReview id={screen.id} onBack={() => setScreen({ kind: "form" })} />
        </section>
      )}
    </div>
  );
}