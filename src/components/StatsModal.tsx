import React, { useMemo } from "react";
import { useStore } from "../store";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export default function StatsModal({ onClose }: { onClose: () => void }) {
  const wishes = useStore((s) => s.wishes);
  useBodyScrollLock();

  const stats = useMemo(() => {
    const total = wishes.length;
    const completed = wishes.filter((w) => w.status === "completed").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const proposalCounts = { Remus: 0, Nicole: 0 };
    wishes.forEach((w) => {
      if (w.proposedBy === "Remus") proposalCounts.Remus += 1;
      if (w.proposedBy === "Nicole") proposalCounts.Nicole += 1;
    });

    const topCompletedWishes = [...wishes]
      .filter((wish) => wish.completedCount > 0)
      .sort((a, b) => {
        if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
        const aRating = a.history.reduce((sum, history) => sum + (history.averageRating || 0), 0);
        const bRating = b.history.reduce((sum, history) => sum + (history.averageRating || 0), 0);
        return bRating - aRating;
      })
      .slice(0, 5);

    return { total, completed, rate, proposalCounts, topCompletedWishes };
  }, [wishes]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[85vh] overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-2xl">📊</span>
            <h3 className="truncate text-xl font-bold text-gray-900 dark:text-gray-100">願望統計</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl border border-pink-100 dark:border-pink-900/30 text-center">
            <div className="text-xl font-black text-pink-600 dark:text-pink-300">{stats.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">願望總數</div>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
            <div className="text-xl font-black text-green-600 dark:text-green-300">{stats.completed}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">已搞掂</div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-900/30 text-center">
            <div className="text-xl font-black text-purple-600 dark:text-purple-300">{stats.rate}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">完成率</div>
          </div>
        </div>

        <div className="space-y-4 text-xs mb-6">
          <section>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Remus", stats.proposalCounts.Remus, "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"],
                ["Nicole", stats.proposalCounts.Nicole, "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300"],
              ].map(([label, count, color]) => (
                <div key={label} className={`rounded-xl border border-transparent p-3 text-center ${color}`}>
                  <div className="text-lg font-black">{count}</div>
                  <div className="mt-0.5">{label}提出</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h4 className="mb-2 font-bold text-gray-800 dark:text-gray-200">最常完成願望 Top 5</h4>
            {stats.topCompletedWishes.length > 0 ? (
              <div className="space-y-2">
                {stats.topCompletedWishes.map((wish, index) => {
                  const ratings = wish.history
                    .map((history) => history.averageRating)
                    .filter((rating): rating is number => typeof rating === "number");
                  const averageRating =
                    ratings.length > 0
                      ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
                      : null;
                  const proposer = wish.proposedBy === "both" ? "共同提出" : `提出：${wish.proposedBy}`;

                  return (
                    <div
                      key={wish.id}
                      className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800"
                    >
                      <span className="w-5 flex-shrink-0 text-center text-sm font-black text-gray-400 dark:text-gray-500">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold text-gray-800 dark:text-gray-200">{wish.title}</div>
                        <div className="mt-0.5 text-gray-500 dark:text-gray-400">
                          {proposer}{averageRating ? ` · 平均 ${averageRating} 分` : ""}
                        </div>
                      </div>
                      <span className="flex-shrink-0 font-bold text-purple-700 dark:text-purple-300">
                        {wish.completedCount} 次
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-3 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                暫時未有完成紀錄
              </div>
            )}
          </section>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 border border-gray-700 rounded-xl font-semibold text-sm active:scale-95 transition-all"
        >
          閂咗佢
        </button>
      </div>
    </div>
  );
}
