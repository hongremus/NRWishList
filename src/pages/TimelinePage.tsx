import React, { useMemo, useState } from "react";
import { useStore } from "../store";
import { Wish, WishHistory } from "../types";

type CompletionEntry = {
  wish: Wish;
  history: WishHistory;
  completionNumber: number;
};

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (!Number.isFinite(date.getTime())) return "日期未定";
  return new Intl.DateTimeFormat("zh-HK", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatMonth(dateString: string) {
  const date = new Date(dateString);
  if (!Number.isFinite(date.getTime())) return "其他時間";
  return new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function getCompletionTime(entry: CompletionEntry) {
  const time = new Date(entry.history.completedAt).getTime();
  return Number.isFinite(time) ? time : 0;
}

function getRemarkPreview(remarks: string[]) {
  const text = remarks.join(" · ").replace(/\s+/g, " ").trim();
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

export default function TimelinePage() {
  const wishes = useStore((state) => state.wishes);
  const hasMoreHistory = useStore((state) => state.hasMoreHistory);
  const isLoadingMoreHistory = useStore((state) => state.isLoadingMoreHistory);
  const loadMoreHistory = useStore((state) => state.loadMoreHistory);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const entries = useMemo(() => {
    const flattened = wishes.flatMap((wish) =>
      wish.history.map((history, historyIndex) => ({
        wish,
        history,
        completionNumber: wish.history.length - historyIndex,
      })),
    );
    return flattened.sort((first, second) => getCompletionTime(second) - getCompletionTime(first));
  }, [wishes]);

  const groupedEntries = useMemo(() => {
    const groups = new Map<string, CompletionEntry[]>();
    for (const entry of entries) {
      const key = formatMonth(entry.history.completedAt);
      const group = groups.get(key) ?? [];
      group.push(entry);
      groups.set(key, group);
    }
    return Array.from(groups.entries());
  }, [entries]);

  const ratedEntries = entries.filter(
    (entry) => typeof entry.history.averageRating === "number",
  );
  const averageRating = ratedEntries.length > 0
    ? ratedEntries.reduce(
        (total, entry) => total + (entry.history.averageRating ?? 0),
        0,
      ) / ratedEntries.length
    : null;

  return (
    <div className="space-y-4 bg-surface text-gray-900" style={{ colorScheme: "light" }}>
      <section className="rounded-3xl border border-gray-100 bg-white px-4 py-5 text-gray-900 shadow-sm sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-wide text-gray-400">OUR STORY</p>
            <h2 className="mt-1 text-2xl font-black sm:text-3xl">我哋嘅足跡</h2>
            <p className="mt-2 text-sm text-gray-500">按完成時間，記低我哋一齊做過嘅事。</p>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <div className="text-2xl font-black">{entries.length}</div>
              <div className="text-[11px] text-gray-400">次完成</div>
            </div>
            {averageRating !== null && (
              <div>
                <div className="text-2xl font-black text-amber-300">{averageRating.toFixed(1)}</div>
                <div className="text-[11px] text-gray-400">平均分</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {groupedEntries.length === 0 ? (
        <section className="border-b border-gray-200 py-12 text-center">
          <div className="text-3xl">🌱</div>
          <h3 className="mt-2 font-bold text-gray-700">仲未有完成紀錄</h3>
          <p className="mt-1 text-sm text-gray-400">完成第一個願望後，呢度會開始記低我哋嘅足跡。</p>
        </section>
      ) : (
        <div className="space-y-8">
          {groupedEntries.map(([month, monthEntries]) => (
            <section key={month}>
              <div className="mb-3 flex items-baseline gap-3">
                <h3 className="text-lg font-black text-gray-900">{month}</h3>
                <span className="text-xs font-semibold text-gray-400">{monthEntries.length} 次完成</span>
              </div>
              <div className="relative ml-2 border-l-2 border-gray-200">
                {monthEntries.map(({ wish, history, completionNumber }) => {
                  const isExpanded = expandedHistoryId === history.id;
                  const remarks = [history.remarks.me, history.remarks.gf].filter(
                    (remark): remark is string => Boolean(remark?.trim()),
                  );
                  return (
                    <article key={history.id} className="relative pb-6 pl-6 last:pb-1">
                      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500" />
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <time className="text-xs font-bold text-gray-500">
                          {formatDate(history.completedAt)}
                        </time>
                        <span className="text-[11px] font-medium text-gray-400">
                          第 {completionNumber} 次
                        </span>
                      </div>
                      <h4 className="mt-1 break-words text-base font-black text-gray-900">
                        {wish.title}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                        {wish.region && <span>📍 {wish.region}</span>}
                        {wish.tags.map((tag) => <span key={tag}>#{tag}</span>)}
                        {typeof history.averageRating === "number" && (
                          <span className="font-bold text-amber-500">★ {history.averageRating}/10</span>
                        )}
                      </div>
                      {remarks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedHistoryId(isExpanded ? null : history.id)}
                          className="mt-2 max-w-full text-left text-xs text-gray-500 hover:text-gray-900"
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? (
                            <div className="space-y-2 border-l-2 border-gray-300 pl-3">
                              {history.remarks.me && (
                                <p className="whitespace-pre-wrap break-words"><strong className="font-bold text-gray-700">Remus：</strong>{history.remarks.me}</p>
                              )}
                              {history.remarks.gf && (
                                <p className="whitespace-pre-wrap break-words"><strong className="font-bold text-gray-700">Nicole：</strong>{history.remarks.gf}</p>
                              )}
                              <span className="inline-block font-semibold">收起感想 ↑</span>
                            </div>
                          ) : (
                            <span className="block max-w-full truncate">
                              「{getRemarkPreview(remarks)}」 <span className="font-semibold">查看 {remarks.length} 個感想 ↓</span>
                            </span>
                          )}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
          {hasMoreHistory && (
            <div className="border-t border-gray-200 pt-4 text-center">
              <button
                type="button"
                onClick={() => void loadMoreHistory()}
                disabled={isLoadingMoreHistory}
                className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-wait disabled:opacity-60"
              >
                {isLoadingMoreHistory ? "載入緊…" : "載入更多足跡"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
