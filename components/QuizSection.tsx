"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "@/lib/theme-provider";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizResult {
  score: number;
  total: number;
  passed: boolean;
  attempt: number;
  answers: {
    questionId: string;
    selectedIndex: number;
    correctIndex: number;
    correct: boolean;
    explanation: string;
  }[];
}

interface PreviousAttempt {
  score: number;
  total: number;
  passed: boolean;
  attempt: number;
  completedAt: string;
}

interface QuizSectionProps {
  topicSlug: string;
  topicTitle: string;
}

type QuizState = "idle" | "loading" | "active" | "submitting" | "results";

export default function QuizSection({ topicSlug, topicTitle }: QuizSectionProps) {
  const { data: session } = useSession();
  const { THEME } = useTheme();
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<PreviousAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasFetchedHistory, setHasFetchedHistory] = useState(false);

  const userEmail = session?.user?.email;
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questions.length || 10;
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  const latestAttempt = previousAttempts.length > 0
    ? previousAttempts[previousAttempts.length - 1]
    : null;
  const hasPassed = previousAttempts.some((a) => a.passed);
  const attemptsUsed = previousAttempts.length;
  const maxAttempts = 2;

  const fetchHistory = useCallback(async () => {
    if (!userEmail || hasFetchedHistory) return;
    try {
      const res = await fetch(
        `/api/quiz/results?userEmail=${encodeURIComponent(userEmail)}&topic=${encodeURIComponent(topicSlug)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          setPreviousAttempts(
            data.results.map((r: { attempt_number: number; score: number; total_questions: number; passed: boolean; completed_at: string }) => ({
              attempt: r.attempt_number,
              score: r.score,
              total: r.total_questions,
              passed: r.passed,
              completedAt: r.completed_at,
            }))
          );
        }
      }
    } catch {
      // Silently fail — history is supplementary
    } finally {
      setHasFetchedHistory(true);
    }
  }, [userEmail, topicSlug, hasFetchedHistory]);

  const startQuiz = async () => {
    if (!userEmail) {
      setError("You must be signed in to take the quiz.");
      return;
    }

    setError(null);
    setQuizState("loading");
    setSelectedAnswers({});
    setResult(null);

    try {
      const res = await fetch(
        `/api/quiz?topic=${encodeURIComponent(topicSlug)}&userEmail=${encodeURIComponent(userEmail)}`
      );

      if (!res.ok) {
        throw new Error(`Failed to load quiz (${res.status})`);
      }

      const data = await res.json();

      if (!data.canTake) {
        setError("You have already completed this quiz.");
        setQuizState("idle");
        return;
      }

      setQuestions(data.questions || []);
      if (data.attempts) {
        setPreviousAttempts(
          data.attempts.map((r: { attempt: number; score: number; total: number; passed: boolean; completedAt?: string; completed_at?: string }) => ({
            attempt: r.attempt,
            score: r.score,
            total: r.total,
            passed: r.passed,
            completedAt: r.completedAt || r.completed_at || "",
          }))
        );
        setHasFetchedHistory(true);
      }
      setQuizState("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quiz. Please try again.");
      setQuizState("idle");
    }
  };

  const selectAnswer = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const submitQuiz = async () => {
    if (!userEmail || !allAnswered) return;

    setError(null);
    setQuizState("submitting");

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicSlug,
          userEmail,
          userName: session?.user?.name || "",
          answers: questions.map((q) => ({
            questionId: q.id,
            selectedIndex: selectedAnswers[q.id],
          })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to submit quiz (${res.status})`);
      }

      const data: QuizResult = await res.json();
      setResult(data);

      setPreviousAttempts((prev) => [
        ...prev,
        {
          score: data.score,
          total: data.total,
          passed: data.passed,
          attempt: data.attempt,
          completedAt: new Date().toISOString(),
        },
      ]);

      setQuizState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz. Please try again.");
      setQuizState("active");
    }
  };

  const optionLabel = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  // Fetch history on first render if signed in
  if (!hasFetchedHistory && userEmail) {
    fetchHistory();
  }

  // --- Idle State ---
  if (quizState === "idle" || quizState === "loading") {
    return (
      <section className="mt-12 mb-8">
        <div
          className="rounded-xl p-6 sm:p-8"
          style={{
            border: `1px solid ${THEME.colors.border}`,
            backgroundColor: THEME.colors.surface,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2
                className="text-2xl font-semibold"
                style={{ color: THEME.colors.text, fontFamily: THEME.typography.fontFamily.sans }}
              >
                Test Your Knowledge — {topicTitle}
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: THEME.colors.textMuted, fontFamily: THEME.typography.fontFamily.sans }}
              >
                10 questions &middot; 90% required to pass &middot; 2 attempts max
              </p>
            </div>
            {hasPassed && (
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
                style={{
                  backgroundColor: THEME.colors.successBg,
                  border: `1px solid ${THEME.colors.successBorder}`,
                  color: THEME.colors.success,
                  fontFamily: THEME.typography.fontFamily.sans,
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Completed — {latestAttempt?.score}/{latestAttempt?.total}
              </span>
            )}
          </div>

          {/* Previous Attempt Results */}
          {previousAttempts.length > 0 && (
            <div className="mb-6 space-y-3">
              {previousAttempts.map((attempt, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm"
                  style={{
                    border: `1px solid ${attempt.passed ? THEME.colors.successBorder : THEME.colors.errorBorder}`,
                    backgroundColor: attempt.passed ? THEME.colors.successBg : THEME.colors.errorBg,
                    color: attempt.passed ? THEME.colors.success : THEME.colors.error,
                    fontFamily: THEME.typography.fontFamily.sans,
                  }}
                >
                  {attempt.passed ? (
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span>
                    Attempt {attempt.attempt}: {attempt.score}/{attempt.total}
                    {attempt.passed ? " — Passed" : " — Did not pass"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Action Area */}
          {hasPassed ? (
            <div
              className="rounded-lg p-4"
              style={{
                border: `1px solid ${THEME.colors.successBorder}`,
                backgroundColor: THEME.colors.successBg,
              }}
            >
              <p className="text-sm" style={{ color: THEME.colors.success, fontFamily: THEME.typography.fontFamily.sans }}>
                Congratulations! You have passed this quiz. No further attempts needed.
              </p>
            </div>
          ) : attemptsUsed >= maxAttempts ? (
            <div
              className="rounded-lg p-4"
              style={{
                border: `1px solid ${THEME.colors.errorBorder}`,
                backgroundColor: THEME.colors.errorBg,
              }}
            >
              <p className="text-sm" style={{ color: THEME.colors.error, fontFamily: THEME.typography.fontFamily.sans }}>
                You have used both attempts. Please review the material and contact your manager if you need assistance.
              </p>
            </div>
          ) : (
            <button
              onClick={startQuiz}
              disabled={quizState === "loading"}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: THEME.colors.teal,
                color: '#FFFFFF',
                fontFamily: THEME.typography.fontFamily.sans,
              }}
            >
              {quizState === "loading" ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Loading Quiz...
                </>
              ) : attemptsUsed > 0 ? (
                "Retake Quiz"
              ) : (
                "Start Quiz"
              )}
            </button>
          )}

          {error && (
            <div
              className="mt-4 rounded-lg px-4 py-3 text-sm"
              style={{
                border: `1px solid ${THEME.colors.errorBorder}`,
                backgroundColor: THEME.colors.errorBg,
                color: THEME.colors.error,
                fontFamily: THEME.typography.fontFamily.sans,
              }}
            >
              {error}
            </div>
          )}
        </div>
      </section>
    );
  }

  // --- Active Quiz State ---
  if (quizState === "active" || quizState === "submitting") {
    return (
      <section className="mt-12 mb-8">
        <div
          className="rounded-xl p-6 sm:p-8"
          style={{
            border: `1px solid ${THEME.colors.border}`,
            backgroundColor: THEME.colors.surface,
          }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2
              className="text-2xl font-semibold"
              style={{ color: THEME.colors.text, fontFamily: THEME.typography.fontFamily.sans }}
            >
              {topicTitle} Quiz
            </h2>
            <div className="flex items-center gap-3">
              <span
                className="text-sm"
                style={{ color: THEME.colors.textMuted, fontFamily: THEME.typography.fontFamily.sans }}
              >
                {answeredCount}/{totalQuestions} answered
              </span>
              <div
                className="w-32 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: THEME.colors.surfaceSubtle }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%`, backgroundColor: THEME.colors.teal }}
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-8">
            {questions.map((question, qIndex) => {
              const isAnswered = selectedAnswers[question.id] !== undefined;
              return (
                <div
                  key={question.id}
                  className="rounded-xl p-5 transition-colors duration-200"
                  style={{
                    border: `1px solid ${isAnswered ? THEME.colors.teal + '4D' : THEME.colors.border}`,
                    backgroundColor: isAnswered ? THEME.colors.teal + '0D' : THEME.colors.surfaceSubtle,
                  }}
                >
                  <div className="flex gap-3 mb-4">
                    <span
                      className="text-sm font-semibold shrink-0 mt-0.5"
                      style={{ color: THEME.colors.teal, fontFamily: THEME.typography.fontFamily.mono }}
                    >
                      Q{qIndex + 1}.
                    </span>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: THEME.colors.text, fontFamily: THEME.typography.fontFamily.sans }}
                    >
                      {question.question}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-8">
                    {question.options.map((option, oIndex) => {
                      const isSelected = selectedAnswers[question.id] === oIndex;
                      return (
                        <button
                          key={oIndex}
                          onClick={() => selectAnswer(question.id, oIndex)}
                          disabled={quizState === "submitting"}
                          className="flex items-start gap-3 rounded-lg px-4 py-3 text-left text-sm transition-all duration-200 disabled:cursor-not-allowed"
                          style={{
                            border: `1px solid ${isSelected ? THEME.colors.teal : THEME.colors.border}`,
                            backgroundColor: isSelected ? THEME.colors.teal + '26' : THEME.colors.surfaceSubtle,
                            color: isSelected ? THEME.colors.text : THEME.colors.textSecondary,
                            fontFamily: THEME.typography.fontFamily.sans,
                          }}
                        >
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold transition-colors duration-200"
                            style={{
                              backgroundColor: isSelected ? THEME.colors.teal : THEME.colors.surfaceSubtle,
                              color: isSelected ? '#FFFFFF' : THEME.colors.textMuted,
                              fontFamily: THEME.typography.fontFamily.mono,
                            }}
                          >
                            {optionLabel(oIndex)}
                          </span>
                          <span className="mt-0.5">{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex items-center justify-between">
            <p
              className="text-sm"
              style={{ color: THEME.colors.textFaint, fontFamily: THEME.typography.fontFamily.sans }}
            >
              {allAnswered
                ? "All questions answered. Ready to submit."
                : `${totalQuestions - answeredCount} question${totalQuestions - answeredCount !== 1 ? "s" : ""} remaining`}
            </p>
            <button
              onClick={submitQuiz}
              disabled={!allAnswered || quizState === "submitting"}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: THEME.colors.teal,
                color: '#FFFFFF',
                fontFamily: THEME.typography.fontFamily.sans,
              }}
            >
              {quizState === "submitting" ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Grading...
                </>
              ) : (
                "Submit Quiz"
              )}
            </button>
          </div>

          {error && (
            <div
              className="mt-4 rounded-lg px-4 py-3 text-sm"
              style={{
                border: `1px solid ${THEME.colors.errorBorder}`,
                backgroundColor: THEME.colors.errorBg,
                color: THEME.colors.error,
                fontFamily: THEME.typography.fontFamily.sans,
              }}
            >
              {error}
            </div>
          )}
        </div>
      </section>
    );
  }

  // --- Results State ---
  if (quizState === "results" && result) {
    const passed = result.passed;
    const canRetakeNow = !passed && result.attempt < maxAttempts;

    return (
      <section className="mt-12 mb-8">
        <div
          className="rounded-xl p-6 sm:p-8"
          style={{
            border: `1px solid ${THEME.colors.border}`,
            backgroundColor: THEME.colors.surface,
          }}
        >
          {/* Score Header */}
          <div className="text-center mb-8">
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                backgroundColor: passed ? THEME.colors.successBg : THEME.colors.errorBg,
                border: `2px solid ${passed ? THEME.colors.success : THEME.colors.error}`,
              }}
            >
              {passed ? (
                <svg className="h-10 w-10" style={{ color: THEME.colors.success }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="h-10 w-10" style={{ color: THEME.colors.error }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h2
              className="text-3xl font-bold"
              style={{ color: THEME.colors.text, fontFamily: THEME.typography.fontFamily.sans }}
            >
              {result.score}/{result.total}
            </h2>
            <p
              className="mt-1 text-sm font-medium"
              style={{
                color: passed ? THEME.colors.success : THEME.colors.error,
                fontFamily: THEME.typography.fontFamily.sans,
              }}
            >
              {passed
                ? "Congratulations — you passed!"
                : `Did not pass (${Math.round((result.score / result.total) * 100)}% — 90% required)`}
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: THEME.colors.textFaint, fontFamily: THEME.typography.fontFamily.sans }}
            >
              Attempt {result.attempt} of {maxAttempts}
            </p>
          </div>

          {/* Answer Breakdown */}
          <div className="space-y-4 mb-8">
            <h3
              className="text-lg font-semibold"
              style={{ color: THEME.colors.text, fontFamily: THEME.typography.fontFamily.sans }}
            >
              Answer Review
            </h3>
            {result.answers.map((answer, i) => {
              const question = questions.find((q) => q.id === answer.questionId);
              if (!question) return null;

              return (
                <div
                  key={answer.questionId}
                  className="rounded-xl p-4"
                  style={{
                    border: `1px solid ${answer.correct ? THEME.colors.successBorder : THEME.colors.errorBorder}`,
                    backgroundColor: answer.correct ? THEME.colors.successBg : THEME.colors.errorBg,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0">
                      {answer.correct ? (
                        <svg className="h-5 w-5" style={{ color: THEME.colors.success }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" style={{ color: THEME.colors.error }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed" style={{ color: THEME.colors.text, fontFamily: THEME.typography.fontFamily.sans }}>
                        <span style={{ color: THEME.colors.teal, fontFamily: THEME.typography.fontFamily.mono, fontWeight: 600 }}>Q{i + 1}.</span>{" "}
                        {question.question}
                      </p>
                      {!answer.correct && (
                        <div className="mt-3 space-y-2 text-sm" style={{ fontFamily: THEME.typography.fontFamily.sans }}>
                          <p style={{ color: THEME.colors.error }}>
                            <span className="font-medium">Your answer:</span>{" "}
                            <span style={{ fontFamily: THEME.typography.fontFamily.mono }}>{optionLabel(answer.selectedIndex)}.</span>{" "}
                            {question.options[answer.selectedIndex]}
                          </p>
                          <p style={{ color: THEME.colors.success }}>
                            <span className="font-medium">Correct answer:</span>{" "}
                            <span style={{ fontFamily: THEME.typography.fontFamily.mono }}>{optionLabel(answer.correctIndex)}.</span>{" "}
                            {question.options[answer.correctIndex]}
                          </p>
                          <p
                            className="mt-2 pl-3"
                            style={{
                              color: THEME.colors.textMuted,
                              borderLeft: `2px solid ${THEME.colors.border}`,
                            }}
                          >
                            {answer.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Area */}
          <div className="flex items-center justify-center gap-4">
            {canRetakeNow ? (
              <button
                onClick={startQuiz}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: THEME.colors.teal,
                  color: '#FFFFFF',
                  fontFamily: THEME.typography.fontFamily.sans,
                }}
              >
                Retake Quiz
              </button>
            ) : passed ? (
              <div
                className="rounded-lg px-6 py-3"
                style={{
                  border: `1px solid ${THEME.colors.successBorder}`,
                  backgroundColor: THEME.colors.successBg,
                }}
              >
                <p className="text-sm font-medium" style={{ color: THEME.colors.success, fontFamily: THEME.typography.fontFamily.sans }}>
                  Quiz complete. You may continue to the next topic.
                </p>
              </div>
            ) : (
              <div
                className="rounded-lg px-6 py-3"
                style={{
                  border: `1px solid ${THEME.colors.errorBorder}`,
                  backgroundColor: THEME.colors.errorBg,
                }}
              >
                <p className="text-sm" style={{ color: THEME.colors.error, fontFamily: THEME.typography.fontFamily.sans }}>
                  Both attempts used. Please review the training material and reach out to your manager.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div
              className="mt-4 rounded-lg px-4 py-3 text-sm"
              style={{
                border: `1px solid ${THEME.colors.errorBorder}`,
                backgroundColor: THEME.colors.errorBg,
                color: THEME.colors.error,
                fontFamily: THEME.typography.fontFamily.sans,
              }}
            >
              {error}
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
}
