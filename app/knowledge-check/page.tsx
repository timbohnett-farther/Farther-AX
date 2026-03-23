"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "Which advisor pathway has the highest compliance sensitivity?",
    options: ["Independent RIA", "No to Low AUM", "Breakaway", "M&A"],
    correctIndex: 2,
    explanation:
      "Breakaway advisors are leaving captive firms with non-compete/non-solicitation agreements, requiring careful sequencing to protect both the advisor and Farther from legal action.",
  },
  {
    id: 2,
    question: "When must the U4 be submitted for a Breakaway advisor?",
    options: [
      "At kickoff meeting",
      "When the deal is signed",
      "30 days before resignation",
      "After the advisor formally resigns",
    ],
    correctIndex: 3,
    explanation:
      "Submitting the U4 before resignation creates a trackable FINRA event that can alert the departing firm prematurely.",
  },
  {
    id: 3,
    question: "Which transition method is the fastest?",
    options: [
      "LPOA (6–8 weeks)",
      "Repaper / ACAT (8–12 weeks)",
      "Master Merge (4–6 weeks)",
      "Direct Transfer",
    ],
    correctIndex: 2,
    explanation:
      "The Master Merge moves assets at the custodian level via a master account merge, making it the fastest of the three transition methods.",
  },
  {
    id: 4,
    question: "Who is the primary owner of the Transitions workstream?",
    options: [
      "AXM (Advisor Experience Manager)",
      "AXA (Advisor Experience Associate)",
      "CTM / CTA (Transitions team)",
      "Compliance team",
    ],
    correctIndex: 2,
    explanation:
      "The Transitions team (CTM/CTA) owns the client asset transfer process. The AXM owns Onboarding, which runs in parallel.",
  },
  {
    id: 5,
    question:
      "Within how many days must an Independent RIA file Form ADV-W after joining Farther?",
    options: ["30 days", "60 days", "90 days", "180 days"],
    correctIndex: 2,
    explanation:
      "Form ADV-W (withdrawal of investment adviser registration) must be filed within 90 days to formally dissolve the advisor's independent RIA status.",
  },
  {
    id: 6,
    question:
      "Which transition method requires the advisor (not clients) to sign a single document to authorize asset transfers?",
    options: ["Master Merge", "Repaper / ACAT", "Direct Transfer", "LPOA"],
    correctIndex: 3,
    explanation:
      "LPOA (Limited Power of Attorney) allows the advisor to sign one document granting Farther authority to transfer client assets without requiring individual client signatures.",
  },
  {
    id: 7,
    question:
      "What is the AXA's primary responsibility during the onboarding process?",
    options: [
      "Managing compliance filings and U4 submission",
      "Day-to-day execution, scheduling, and logistics support",
      "Conducting the Focus Team review",
      "Owning the transitions workstream",
    ],
    correctIndex: 1,
    explanation:
      "The AXA handles day-to-day execution — scheduling meetings, tracking documents, maintaining the Transition Tracker, and supporting the AXM in logistics.",
  },
];

function getScoreMessage(score: number): string {
  if (score === 7) {
    return "Perfect score! You're ready to handle any onboarding scenario.";
  } else if (score >= 5) {
    return "Great work! Review the sections you missed to sharpen your knowledge.";
  } else if (score >= 3) {
    return "Good effort. We recommend revisiting the relevant sections before your next advisor onboarding.";
  } else {
    return "Let's review together. Work through the playbook sections and try again.";
  }
}

export default function KnowledgeCheckPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(QUESTIONS.length).fill(null)
  );
  const [quizComplete, setQuizComplete] = useState(false);

  const currentQuestion = QUESTIONS[currentIndex];
  const isAnswered = selectedAnswer !== null;
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;

  const score = answers.filter(
    (ans, i) => ans === QUESTIONS[i].correctIndex
  ).length;

  function handleSelectAnswer(optionIndex: number) {
    if (isAnswered) return;
    setSelectedAnswer(optionIndex);
    const updated = [...answers];
    updated[currentIndex] = optionIndex;
    setAnswers(updated);
  }

  function handleNext() {
    if (isLastQuestion) {
      setQuizComplete(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  }

  function handleRetake() {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setAnswers(Array(QUESTIONS.length).fill(null));
    setQuizComplete(false);
  }

  const progressPercent = ((currentIndex + (isAnswered ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <PageLayout
      step={13}
      title="Knowledge Check"
      subtitle="Test Your Onboarding & Transition Knowledge"
      backHref="/breakaway-process"
    >
      <div className="max-w-2xl mx-auto">
        {quizComplete ? (
          /* Score screen */
          <div
            className="rounded-xl border p-10 text-center"
            style={{
              backgroundColor: "#2a2a2a",
              borderColor: "rgba(250,247,242,0.08)",
            }}
          >
            {/* Trophy / score badge */}
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                backgroundColor: "#1d7682",
                boxShadow: "0 0 24px rgba(29, 118, 130, 0.5)",
              }}
            >
              <span
                className="text-white text-3xl font-bold"
                style={{ fontFamily: "'ABC Arizona Text', Georgia, serif" }}
              >
                {score}/7
              </span>
            </div>

            <h2
              className="text-3xl font-bold mb-3"
              style={{
                fontFamily: "'ABC Arizona Text', Georgia, serif",
                color: "#FAF7F2",
              }}
            >
              You scored {score} / 7
            </h2>

            <p
              className="text-base mb-8 max-w-md mx-auto leading-relaxed"
              style={{ color: "#FAF7F2" }}
            >
              {getScoreMessage(score)}
            </p>

            {/* Per-question result summary */}
            <div className="text-left mb-8 space-y-2">
              {QUESTIONS.map((q, i) => {
                const userAns = answers[i];
                const correct = userAns === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    className="flex items-start gap-3 px-4 py-3 rounded-lg border"
                    style={{
                      borderColor: correct ? "#86EFAC" : "#FCA5A5",
                      backgroundColor: correct
                        ? "rgba(134,239,172,0.12)"
                        : "rgba(252,165,165,0.12)",
                      boxShadow: correct
                        ? "0 0 8px rgba(134, 239, 172, 0.15)"
                        : "0 0 8px rgba(252, 165, 165, 0.15)",
                    }}
                  >
                    <span
                      className="text-base font-bold mt-0.5 shrink-0"
                      style={{ color: correct ? "#16A34A" : "#DC2626" }}
                    >
                      {correct ? "✓" : "✗"}
                    </span>
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "#FAF7F2" }}
                      >
                        Q{q.id}: {q.question}
                      </p>
                      {!correct && userAns !== null && (
                        <p className="text-xs mt-0.5" style={{ color: "rgba(250,247,242,0.5)" }}>
                          Correct answer: {q.options[q.correctIndex]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleRetake}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-md text-sm font-semibold text-white transition-all"
              style={{
                backgroundColor: "#1d7682",
                boxShadow: "0 0 16px rgba(29, 118, 130, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 0 24px rgba(29, 118, 130, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 0 16px rgba(29, 118, 130, 0.3)";
              }}
            >
              ↺ Retake Quiz
            </button>
          </div>
        ) : (
          /* Question screen */
          <div>
            {/* Progress header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: "rgba(250,247,242,0.5)" }}
                >
                  Question {currentIndex + 1} of {QUESTIONS.length}
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: "#1d7682" }}
                >
                  {Math.round(progressPercent)}% complete
                </span>
              </div>
              {/* Progress bar */}
              <div
                className="w-full rounded-full h-2"
                style={{ backgroundColor: "rgba(250,247,242,0.08)" }}
              >
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: "#1d7682",
                    boxShadow: "0 0 8px rgba(29, 118, 130, 0.4)",
                  }}
                />
              </div>
            </div>

            {/* Question card */}
            <div
              className="rounded-xl border p-8"
              style={{
                backgroundColor: "#2a2a2a",
                borderColor: "rgba(250,247,242,0.08)",
              }}
            >
              <h2
                className="text-xl font-bold mb-6 leading-snug"
                style={{
                  fontFamily: "'ABC Arizona Text', Georgia, serif",
                  color: "#FAF7F2",
                }}
              >
                {currentQuestion.question}
              </h2>

              {/* Answer options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrect = i === currentQuestion.correctIndex;

                  let borderColor = "rgba(250,247,242,0.08)";
                  let bgColor = "#2f2f2f";
                  let textColor = "#FAF7F2";

                  if (isAnswered) {
                    if (isCorrect) {
                      borderColor = "#86EFAC";
                      bgColor = "rgba(134,239,172,0.18)";
                      textColor = "#15532B";
                    } else if (isSelected && !isCorrect) {
                      borderColor = "#FCA5A5";
                      bgColor = "rgba(252,165,165,0.18)";
                      textColor = "#7F1D1D";
                    } else {
                      bgColor = "#2f2f2f";
                      borderColor = "rgba(250,247,242,0.08)";
                      textColor = "rgba(250,247,242,0.5)";
                    }
                  }

                  const optionLabels = ["A", "B", "C", "D"];

                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectAnswer(i)}
                      disabled={isAnswered}
                      className="w-full text-left flex items-start gap-3 px-5 py-4 rounded-lg border transition-all duration-200 hover:shadow-[0_0_12px_rgba(29,118,130,0.15)]"
                      style={{
                        borderColor,
                        backgroundColor: bgColor,
                        cursor: isAnswered ? "default" : "pointer",
                      }}
                    >
                      <span
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                        style={{
                          backgroundColor: isAnswered
                            ? isCorrect
                              ? "#16A34A"
                              : isSelected
                              ? "#DC2626"
                              : "rgba(250,247,242,0.08)"
                            : "#1d7682",
                          color: isAnswered
                            ? isCorrect || isSelected
                              ? "#fff"
                              : "rgba(250,247,242,0.5)"
                            : "#fff",
                        }}
                      >
                        {optionLabels[i]}
                      </span>
                      <span
                        className="text-sm font-medium leading-relaxed"
                        style={{ color: textColor }}
                      >
                        {option}
                      </span>
                      {isAnswered && isCorrect && (
                        <span
                          className="ml-auto shrink-0 text-sm font-bold"
                          style={{ color: "#16A34A" }}
                        >
                          ✓
                        </span>
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <span
                          className="ml-auto shrink-0 text-sm font-bold"
                          style={{ color: "#DC2626" }}
                        >
                          ✗
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {isAnswered && (
                <div
                  className="rounded-lg border px-5 py-4 mb-6"
                  style={{
                    borderColor:
                      selectedAnswer === currentQuestion.correctIndex
                        ? "#86EFAC"
                        : "#FCA5A5",
                    backgroundColor:
                      selectedAnswer === currentQuestion.correctIndex
                        ? "rgba(134,239,172,0.10)"
                        : "rgba(252,165,165,0.10)",
                  }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{
                      color:
                        selectedAnswer === currentQuestion.correctIndex
                          ? "#16A34A"
                          : "#DC2626",
                    }}
                  >
                    {selectedAnswer === currentQuestion.correctIndex
                      ? "Correct"
                      : "Incorrect"}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "#FAF7F2" }}>
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Next button */}
              {isAnswered && (
                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold text-white transition-all"
                    style={{
                      backgroundColor: "#1d7682",
                      boxShadow: "0 0 16px rgba(29, 118, 130, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 24px rgba(29, 118, 130, 0.5)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 0 16px rgba(29, 118, 130, 0.3)";
                    }}
                  >
                    {isLastQuestion ? "See Results" : "Next Question"} →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
