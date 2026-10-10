"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { database } from "@/lib/db";
import { getQuiz } from "@/lib/data/quizzes";
import { useStoredQuery } from "@/lib/storage/react";

type QuizReviewProps = {
  id: string;
  onBack: () => void;
};

/** A past quiz, read-only: every question, its options, the answer chosen and the right one. */
export function QuizReview({ id, onBack }: QuizReviewProps) {
  const { data: quiz, isLoading } = useStoredQuery(database, () => getQuiz(id), [id]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm text-muted-foreground">
            That quiz is no longer here — it may have been deleted.
          </p>
          <Button type="button" variant="outline" onClick={onBack}>
            Back to quizzes
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Review · {quiz.score} of {quiz.total}</CardDescription>
          <CardTitle className="text-lg leading-snug">{quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.questions.map((question, questionIndex) => {
            const chosen = quiz.answers[questionIndex];
            const correct = chosen === question.correctIndex;
            return (
              <div key={questionIndex} className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0">
                <p className="text-sm font-medium leading-snug">
                  {questionIndex + 1}. {question.question}
                </p>
                <ul className="space-y-1">
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === question.correctIndex;
                    const isChosen = optionIndex === chosen;
                    return (
                      <li
                        key={optionIndex}
                        className={
                          isCorrect
                            ? "text-sm font-medium text-foreground"
                            : "text-sm text-muted-foreground"
                        }
                      >
                        {optionIndex + 1}. {option}
                        {isCorrect && <span className="ml-2 text-xs font-medium">correct answer</span>}
                        {isChosen && (
                          <Badge className="ml-2 text-xs" variant={correct ? "default" : "destructive"}>
                            your answer
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Button type="button" variant="outline" size="lg" className="w-full text-base" onClick={onBack}>
        Back to quizzes
      </Button>
    </div>
  );
}