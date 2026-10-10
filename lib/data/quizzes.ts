import { database, type Quiz } from "@/lib/db";

const quizzes = async () => (await database.ready()).quizzes;

/** Every finished quiz, newest first. */
export async function listQuizzes(): Promise<Quiz[]> {
  return (await quizzes()).orderBy("createdAt").reverse().toArray();
}

export async function getQuiz(id: string): Promise<Quiz | undefined> {
  return (await quizzes()).get(id);
}

export async function saveQuiz(quiz: Quiz): Promise<void> {
  await (await quizzes()).put(quiz);
}

export async function deleteQuiz(id: string): Promise<void> {
  await (await quizzes()).delete(id);
}
