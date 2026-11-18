import React, { useMemo, useState } from "react";
import { useStore } from "../store";
import { Wish, WishHistory } from "../types";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

const LOW_RATING_LIMIT = 4;

type LowRatedEntry = {
  wish: Wish;
  history: WishHistory;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (!Number.isFinite(date.getTime())) return "日期未定";
  return new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function previewRemark(text: string) {
  return text.length > 84 ? `${text.slice(0, 84)}…` : text;
}

export default function LowRatedModal({ onClose }: { onClose: () => void }) {
  const wishes = useStore((state) => state.wishes);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  useBodyScrollLock();

  const entries = useMemo<LowRatedEntry[]>(() => wishes
    .filter((wish) => wish.status === "completed")
    .flatMap((wish) => wish.history
      .filter((history) => typeof history.averageRating === "number" && history.averageRating <= LOW_RATING_LIMIT)
      .map((history) => ({ wish, history })))
    .sort((first, second) => {
      const firstRating = first.history.averageRating ?? LOW_RATING_LIMIT;
      const secondRating = second.history.averageRating ?? LOW_RATING_LIMIT;
      if (firstRating !== secondRating) return firstRating - secondRating;
      return new Date(second.history.completedAt).getTime() - new Date(first.history.completedAt).getTime();
    }), [wishes]);

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 backdrop-blur-xs sm:items-center sm:p-4">
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-3xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 p-4 dark:border-gray-800 sm:p-6">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">防中伏區</h3>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">已完成但評分 4 分或以下嘅紀錄</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-gray-700"
            aria-label="關閉防中伏區"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 sm:px-6">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              暫時未有中伏紀錄
            </div>
          ) : (
            <div>
              {entries.map(({ wish, history }) => {
                const remarks = [
                  history.remarks.me ? { label: "Remus", text: history.remarks.me } : null,
                  history.remarks.gf ? { label: "Nicole", text: history.remarks.gf } : null,
                ].filter((remark): remark is { label: string; text: string } => Boolean(remark));
                const canExpand = remarks.some((remark) => remark.text.length > 84);
                const isExpanded = expandedId === history.id;

                return (
                  <div key={`${wish.id}-${history.id}`} className="border-b border-gray-100 py-4 last:border-b-0 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="break-words font-bold text-gray-900 dark:text-gray-100">{wish.title}</h4>
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDate(history.completedAt)}</span>
                          {wish.region && <span>📍 {wish.region}</span>}
                        </div>
                      </div>
                      <span className="shrink-0 text-lg font-black text-red-600 dark:text-red-300">
                        {(history.averageRating ?? 0).toFixed(1)}/10
                      </span>
                    </div>

                    {remarks.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : history.id)}
                        className="mt-2 block w-full text-left text-xs text-gray-600 dark:text-gray-300"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <div className="space-y-1 whitespace-pre-wrap break-words border-l-2 border-red-200 pl-3 dark:border-red-800">
                            {remarks.map((remark) => <p key={remark.label}><strong className="font-semibold text-gray-700 dark:text-gray-200">{remark.label}：</strong>{remark.text}</p>)}
                            <span className="inline-block pt-1 font-semibold text-gray-500 dark:text-gray-400">收埋 ↑</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {remarks.map((remark) => (
                              <p key={remark.label} className="flex min-w-0 gap-1">
                                <strong className="shrink-0 font-semibold text-gray-700 dark:text-gray-200">{remark.label}：</strong>
                                <span className="min-w-0 truncate">{previewRemark(remark.text)}</span>
                              </p>
                            ))}
                            {canExpand && <span className="inline-block pt-1 font-semibold text-red-600 dark:text-red-300">查看完整評語 ↓</span>}
                          </div>
                        )}
                      </button>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">未有評語</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-gray-800 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
