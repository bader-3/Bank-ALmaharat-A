"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { ReviewQuizQuestion } from "@/types/review";
import { useState } from "react";

interface ReviewQuizProps {
  questions: ReviewQuizQuestion[];
  onSubmit: (answers: number[]) => void;
  isSubmitting?: boolean;
}

export function ReviewQuiz({ questions, onSubmit, isSubmitting }: ReviewQuizProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const allAnswered = questions.every((q) => answers[q.id] !== undefined);

  return (
    <Card padding="md" className="mt-4 space-y-5">
      <p className="text-sm font-semibold text-navy-900">اختبار قصير — {questions.length} أسئلة</p>

      <ol className="space-y-5">
        {questions.map((question, index) => (
          <li key={question.id}>
            <p className="text-sm font-medium text-navy-900">
              {index + 1}. {question.question}
            </p>
            <div className="mt-3 grid gap-2">
              {question.options.map((option, optionIndex) => {
                const selected = answers[question.id] === optionIndex;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
                    }
                    className={cn(
                      "rounded-xl border px-4 py-3 text-start text-sm transition-colors",
                      selected
                        ? "border-sage-400 bg-sage-50 text-navy-900"
                        : "border-border/60 bg-surface text-foreground-secondary hover:border-sage-200",
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <Button
        fullWidth
        disabled={!allAnswered || isSubmitting}
        onClick={() =>
          onSubmit(questions.map((q) => answers[q.id] ?? -1))
        }
      >
        {isSubmitting ? "…" : "إرسال الإجابات"}
      </Button>
    </Card>
  );
}
