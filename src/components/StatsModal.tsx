import React, { useMemo } from "react";
import { useStore } from "../store";

export default function StatsModal({ onClose }: { onClose: () => void }) {
  const wishes = useStore((s) => s.wishes);

  const stats = useMemo(() => {
    const total = wishes.length;
    const completed = wishes.filter((w) => w.status === "completed").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 所有歷史評分算平均分
    const allRatings: number[] = [];
    wishes.forEach((w) => {
      w.history.forEach((h) => {
        if (h.averageRating) allRatings.push(h.averageRating);
      });
    });
    const avgRating =
      allRatings.length > 0
        ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
        : "尚無";

    // 最常用 Tag
    const tagCounts: Record<string, number> = {};
    wishes.forEach((w) => {
      w.tags.forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
    });
    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    const topTag = sortedTags.length > 0 ? `#${sortedTags[0][0]} (${sortedTags[0][1]}次)` : "無";

    // 最多完成次數的願望
    const sortedByCompleted = [...wishes].sort((a, b) => b.completedCount - a.completedCount);
    const mostCompletedWish =
      sortedByCompleted.length > 0 && sortedByCompleted[0].completedCount > 0
        ? `${sortedByCompleted[0].title} (${sortedByCompleted[0].completedCount}次)`
        : "無";

    return { total, completed, rate, avgRating, topTag, mostCompletedWish };
  }, [wishes]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">許願與實現統計</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-2xl border border-pink-100 dark:border-pink-900/30 text-center">
            <div className="text-2xl font-black text-pink-600 dark:text-pink-300">{stats.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">總許願數</div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30 text-center">
            <div className="text-2xl font-black text-green-600 dark:text-green-300">{stats.completed}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">已實現願望</div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/30 text-center">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-300">{stats.rate}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">實現達成率</div>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 text-center">
            <div className="text-2xl font-black text-amber-500">{stats.avgRating}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">平均實現評分</div>
          </div>
        </div>

        <div className="space-y-2 text-xs mb-6">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">🏷️ 最常用 Tag:</span>
            <span className="font-bold text-gray-800 dark:text-gray-200">{stats.topTag}</span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400">🏆 最多完成願望:</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[180px]">
              {stats.mostCompletedWish}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold text-sm active:scale-95 transition-all"
        >
          關閉
        </button>
      </div>
    </div>
  );
}
