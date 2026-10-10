"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AI_PRIVACY_NOTE } from "@/lib/ai";

type QuizFormProps = {
  notes: string;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  onSample: () => void;
  /** Shown instead of calling the model when the notes are empty. */
  validation: string | null;
  /** The assistant's failure message, with a way to retry. */
  problem: string | null;
  onTryAgain: () => void;
  busy: boolean;
};

export function QuizForm({
  notes,
  onNotesChange,
  onSubmit,
  onSample,
  validation,
  problem,
  onTryAgain,
  busy,
}: QuizFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
      noValidate
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <Label htmlFor="class-notes" className="text-base">
          Your class notes
        </Label>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="min-h-8 px-2"
          onClick={onSample}
        >
          Load sample notes
        </Button>
      </div>
      <Textarea
        id="class-notes"
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        placeholder="Paste the notes you took in class — the more facts, the better the quiz."
        className="min-h-44 text-base"
        aria-invalid={validation ? true : undefined}
      />
      <p className="text-xs text-muted-foreground">{AI_PRIVACY_NOTE}</p>
      {validation && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {validation}
        </p>
      )}
      {problem && (
        <div role="alert" className="space-y-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm text-destructive">{problem}</p>
          <Button type="button" variant="outline" size="sm" onClick={onTryAgain} disabled={busy}>
            Try again
          </Button>
        </div>
      )}
      <Button type="submit" size="lg" className="w-full text-base" disabled={busy}>
        {busy ? "Thinking…" : "Make quiz"}
      </Button>
    </form>
  );
}