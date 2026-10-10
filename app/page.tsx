import { QuizMaker } from "@/components/quiz/quiz-maker";
import { identity } from "@/app/identity";

export default function Home() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {identity.name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Turn your class notes into a quiz
        </h1>
        <p className="text-lg text-muted-foreground">
          Paste what you wrote in class, get five multiple-choice questions, answer them one at a
          time and keep your scores.
        </p>
      </header>
      <QuizMaker />
    </main>
  );
}