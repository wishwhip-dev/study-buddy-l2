"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Quiz } from "@/lib/db";
import { deleteQuiz, listQuizzes } from "@/lib/data/quizzes";
import { database } from "@/lib/db";
import { useStoredQuery } from "@/lib/storage/react";

type QuizListProps = {
  onOpen: (id: string) => void;
};

/** The quizzes already played, newest first, each one openable for review and deletable. */
export function QuizList({ onOpen }: QuizListProps) {
  const { data: quizzes, isLoading } = useStoredQuery(database, listQuizzes, []);
  const [pendingDelete, setPendingDelete] = useState<Quiz | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteQuiz(pendingDelete.id);
      toast("Quiz deleted.");
      setPendingDelete(null);
    } catch (error) {
      toast.error("The quiz could not be deleted.", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section aria-label="Past quizzes" className="space-y-3">
      <h2 className="text-lg font-semibold">Past quizzes</h2>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : !quizzes || quizzes.length === 0 ? (
        <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          No quizzes yet. Make your first one from the notes above — it will be saved here with its
          score once you finish it.
        </p>
      ) : (
        <ul className="space-y-2">
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <Card>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => onOpen(quiz.id)}
                    className="min-h-11 flex-1 text-left"
                    aria-label={`Review quiz: ${quiz.title}`}
                  >
                    <span className="block font-medium leading-snug underline-offset-4 hover:underline">
                      {quiz.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(quiz.createdAt)} · {quiz.score} of {quiz.total}
                    </span>
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setPendingDelete(quiz)}
                  >
                    Delete quiz
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this quiz?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `"${pendingDelete.title}" and its score will be removed for good. This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Keep it
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={deleting}>
              Delete quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function listQuizzesLive() {
  return import("@/lib/data/quizzes").then((module) => module.listQuizzes());
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}