"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { useTheme } from "@/lib/theme-provider";

interface QuizResult {
  topic_slug: string;
  attempt_number: number;
  score: number;
  total_questions: number;
  passed: boolean;
  completed_at: string;
}

const QUIZ_TOPICS = [
  { slug: "introduction", label: "Introduction", step: 1, href: "/introduction" },
  { slug: "onboarding-vs-transitions", label: "Onboarding vs. Transitions", step: 2, href: "/onboarding-vs-transitions" },
  { slug: "key-documents", label: "Key Documents", step: 3, href: "/key-documents" },
  { slug: "breakaway", label: "Breakaway Pathway", step: 4, href: "/breakaway" },
  { slug: "independent-ria", label: "Independent RIA", step: 5, href: "/independent-ria" },
  { slug: "ma", label: "M&A Pathway", step: 6, href: "/ma" },
  { slug: "no-to-low-aum", label: "No to Low AUM", step: 7, href: "/no-to-low-aum" },
  { slug: "lpoa", label: "LPOA Transition", step: 8, href: "/lpoa" },
  { slug: "breakaway-process", label: "Breakaway Process", step: 9, href: "/breakaway-process" },
];

export default function KnowledgeCheckPage() {
  const { THEME } = useTheme();
  const { data: session } = useSession();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/quiz/results?userEmail=${encodeURIComponent(session.user.email)}`)
      .then(r => r.json())
      .then(data => setResults(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.user?.email]);

  const getTopicResults = (slug: string) =>
    results.filter(r => r.topic_slug === slug);

  const hasPassed = (slug: string) =>
    getTopicResults(slug).some(r => r.passed);

  const getBestScore = (slug: string) => {
    const topicResults = getTopicResults(slug);
    if (topicResults.length === 0) return null;
    return Math.max(...topicResults.map(r => r.score));
  };

  const passedCount = QUIZ_TOPICS.filter(t => hasPassed(t.slug)).length;
  const totalTopics = QUIZ_TOPICS.length;
  const completionPct = Math.round((passedCount / totalTopics) * 100);

  return (
    <PageLayout
      step={13}
      title="Knowledge Check"
      subtitle="Training Logbook & Quiz Dashboard"
      backHref="/calendar-generator"
    >
      <div className="max-w-3xl mx-auto">
        {/* Overall Progress */}
        <div
          className="rounded-xl p-8 mb-8"
          style={{
            backgroundColor: THEME.colors.surface,
            border: `1px solid ${THEME.colors.border}`,
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: THEME.colors.text, fontFamily: THEME.typography.fontFamily.sans }}
              >
                Training Progress
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: THEME.colors.textMuted, fontFamily: THEME.typography.fontFamily.sans }}
              >
                {session?.user?.name || "User"} &middot; {session?.user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p
                  className="text-3xl font-bold tabular-nums"
                  style={{ color: THEME.colors.text, fontFamily: THEME.typography.fontFamily.mono }}
                >
                  {passedCount}/{totalTopics}
                </p>
                <p
                  className="text-xs"
                  style={{ color: THEME.colors.textFaint, fontFamily: THEME.typography.fontFamily.sans }}
                >
                  quizzes passed
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div
            className="w-full h-3 rounded-full overflow-hidden mb-2"
            style={{ backgroundColor: THEME.colors.surfaceSubtle }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPct}%`, backgroundColor: THEME.colors.teal }}
            />
          </div>
          <p
            className="text-xs text-right"
            style={{ color: THEME.colors.textFaint, fontFamily: THEME.typography.fontFamily.sans }}
          >
            {completionPct}% complete
          </p>

          {passedCount === totalTopics && (
            <div
              className="mt-6 rounded-lg p-4 text-center"
              style={{
                border: `1px solid ${THEME.colors.successBorder}`,
                backgroundColor: THEME.colors.successBg,
              }}
            >
              <p
                className="text-sm font-medium"
                style={{ color: THEME.colors.success, fontFamily: THEME.typography.fontFamily.sans }}
              >
                All training quizzes completed. You are fully certified on the AX Playbook.
              </p>
            </div>
          )}
        </div>

        {/* Quiz Status Grid */}
        <div className="space-y-3">
          {loading ? (
            <>
              {[...Array(9)].map((_, i) => (
                <div key={i} className="shimmer h-20 rounded-xl" />
              ))}
            </>
          ) : (
            QUIZ_TOPICS.map((topic) => {
              const topicResults = getTopicResults(topic.slug);
              const passed = hasPassed(topic.slug);
              const bestScore = getBestScore(topic.slug);
              const attemptsUsed = topicResults.length;

              return (
                <div
                  key={topic.slug}
                  className="rounded-xl p-5 transition-colors"
                  style={{
                    border: `1px solid ${
                      passed
                        ? THEME.colors.successBorder
                        : attemptsUsed > 0
                        ? THEME.colors.warningBorder
                        : THEME.colors.border
                    }`,
                    backgroundColor: passed
                      ? THEME.colors.successBg
                      : attemptsUsed > 0
                      ? THEME.colors.warningBg
                      : THEME.colors.surfaceSubtle,
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Step number */}
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                      style={{
                        backgroundColor: THEME.colors.surfaceSubtle,
                        color: THEME.colors.teal,
                        fontFamily: THEME.typography.fontFamily.mono,
                      }}
                    >
                      {String(topic.step).padStart(2, "0")}
                    </span>

                    {/* Topic info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: THEME.colors.text, fontFamily: THEME.typography.fontFamily.sans }}
                      >
                        {topic.label}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: THEME.colors.textFaint, fontFamily: THEME.typography.fontFamily.sans }}
                      >
                        {attemptsUsed === 0
                          ? "Not started"
                          : `${attemptsUsed}/2 attempt${attemptsUsed !== 1 ? "s" : ""} used`}
                        {bestScore !== null && ` · Best: ${bestScore}/10`}
                      </p>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      {passed ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: THEME.colors.successBg,
                            border: `1px solid ${THEME.colors.successBorder}`,
                            color: THEME.colors.success,
                          }}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          Passed
                        </span>
                      ) : attemptsUsed >= 2 ? (
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: THEME.colors.errorBg,
                            border: `1px solid ${THEME.colors.errorBorder}`,
                            color: THEME.colors.error,
                          }}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Review Needed
                        </span>
                      ) : (
                        <Link
                          href={topic.href}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                          style={{
                            backgroundColor: THEME.colors.teal + '26',
                            border: `1px solid ${THEME.colors.teal}4D`,
                            color: THEME.colors.teal,
                          }}
                        >
                          {attemptsUsed > 0 ? "Retake" : "Take Quiz"} →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Attempt details */}
                  {topicResults.length > 0 && (
                    <div className="mt-3 ml-14 space-y-1">
                      {topicResults.map((r) => (
                        <div
                          key={`${r.topic_slug}-${r.attempt_number}`}
                          className="flex items-center gap-2 text-xs"
                          style={{ color: THEME.colors.textFaint, fontFamily: THEME.typography.fontFamily.sans }}
                        >
                          <span className="tabular-nums" style={{ fontFamily: THEME.typography.fontFamily.mono }}>
                            Attempt {r.attempt_number}: {r.score}/{r.total_questions}
                          </span>
                          <span>·</span>
                          <span>{r.passed ? "Passed" : "Failed"}</span>
                          <span>·</span>
                          <span>{new Date(r.completed_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </PageLayout>
  );
}
