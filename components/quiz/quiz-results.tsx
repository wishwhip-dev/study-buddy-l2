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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/db";

type QuizResultsProps = {
  title: string;
  questions: QuizQuestion[];
  answers: number[];
  score: number;
  onMakeAnother: () => void;
};

export function QuizResults({ title, questions, answers, score, onMakeAnother }: QuizResultsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="items-start">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-3xl leading-tight sm:text-4xl">
            You scored {score} of {questions.length}
          </CardTitle>
          <CardDescription>
            {score === questions.length
              ? "Every one right — the notes stuck."
              : score >= questions.length / 2
                ? "A solid pass. Re-read the ones you missed below."
                : "Worth another read of the notes — see what you missed below."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-2/5">Question</TableHead>
                <TableHead className="w-2/5">You answered</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question, questionIndex) => {
                const chosen = answers[questionIndex];
                const correct = chosen === question.correctIndex;
                return (
                  <TableRow key={questionIndex}>
                    <TableCell className="align-top">
                      <p className="text-sm font-medium leading-snug">{question.question}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Correct: {question.options[question.correctIndex]}
                      </p>
                    </TableCell>
                    <TableCell className="align-top text-sm leading-snug">
                      {chosen >= 0 ? question.options[chosen] : "Not answered"}
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge variant={correct ? "default" : "destructive"} className="text-xs">
                        {correct ? "Right" : "Wrong"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Button type="button" size="lg" className="w-full text-base" onClick={onMakeAnother}>
        Make another quiz
      </Button>
    </div>
  );
}