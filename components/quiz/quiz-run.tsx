"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QuizQuestion } from "@/lib/db";

type QuizRunProps = {
  questions: QuizQuestion[];
  notes: string;
  title: string;
  /** Called once, with the option chosen for every question in order. */
  onDone: (answers: number[]) => void;
};

/**
 * One question at a time. Options are real buttons (Tab, Enter, Space all work) and the number
 * keys 1–4 select the numbered option, so the whole quiz can be played from the keyboard.
 */
export function QuizRun({ questions, notes, title, onDone }: QuizRunProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const question = questions[index];
  const isLast = index === questions.length - 1;

  const choose = useCallback((option: number) => setSelected(option), []);

  const advance = useCallback(() => {
    if (selected === null) return;
    if (isLast) {
      onDone(questions.map((_, i) => (i === index ? selected : -1)));
      // `selected` for the other questions is tracked in the ref below, not here.
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  }, [index, isLast, onDone, questions, selected]);

  // The answers so far live in a ref-free way: keep them in state alongside the index.
  const [answers, setAnswers] = useState<number[]>(() => questions.map(() => -1));

  const record = useCallback(
    (option: number) => {
      setSelected(option);
      setAnswers((previous) => {
        const next = [...previous];
        next[index] = option;
        return next;
      });
    },
    [index],
  );

  const finish = useCallback(() => {
    onDone(answers);
  }, [answers, onDone]);

  const advanceOrFinish = useCallback(() => {
    if (selected === null) return;
    if (isLast) {
      finish();
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  }, [finish, index, isLast, selected]);

  // Keyboard: 1–4 pick an option, Enter moves on. Ignored while typing in the notes.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "TEXTAREA" ||
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (typing) return;
      if (event.key >= "1" && event.key <= "4") {
        const option = Number(event.key) - 1;
        if (option < question.options.length) {
          event.preventDefault();
          record(option);
        }
      } else if (event.key === "Enter" && selected !== null) {
        // preventDefault stops the focused button's own activation, so Enter advances once.
        event.preventDefault();
        advanceOrFinish();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advanceOrFinish, question, record, selected]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>From your notes</CardDescription>
          <CardTitle className="text-base leading-snug">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
            {notes}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>
            Question {index + 1} of {questions.length}
          </CardDescription>
          <CardTitle className="text-lg leading-snug">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div role="group" aria-label="Answer options" className="space-y-2">
            {question.options.map((option, optionIndex) => {
              const isSelected = selected === optionIndex;
              return (
                <Button
                  key={optionIndex}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  aria-pressed={isSelected}
                  onClick={() => record(optionIndex)}
                  className="flex h-auto min-h-11 w-full items-start gap-3 whitespace-normal px-4 py-3 text-left"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                    {optionIndex + 1}
                  </span>
                  <span className="text-sm leading-snug">{option}</span>
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: press keys 1–4 to answer, Enter for the next question.
          </p>
          <Button
            type="button"
            size="lg"
            className="w-full text-base"
            disabled={selected === null}
            onClick={advanceOrFinish}
          >
            {isLast ? "See results" : "Next question"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}