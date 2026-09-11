import React, { useMemo, useState } from "react";
import { useStore } from "../store";
import WishCard from "./WishCard";

type SortOption = "createdAt" | "priority" | "deadline" | "completedCount";

export default function WishList() {
  const wishes = useStore((s) => s.wishes);
  const availableTags = useStore((s) => s.availableTags);
  const currentUser = useStore((s) => s.currentUser);
  const isRemus = currentUser?.username === "Remus";

  const [statusFilter, setStatusFilter] = useState<"open" | "completed" | "all">("open");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("createdAt");

  // 所有願望中出現過的 tags 與 preset tags 的聯集
  const allTags = useMemo(() => {
    const set = new Set([...availableTags, ...wishes.flatMap((w) => w.tags)]);
    return Array.from(set);
  }, [wishes, availableTags]);

  // 過濾與排序邏輯
  const filteredAndSorted = useMemo(() => {
    let result = wishes.filter((w) => {
      const matchStatus =
        statusFilter === "all" ? true : statusFilter === "open" ? w.status === "open" : w.status === "completed";
      const matchTag = tagFilter ? w.tags.includes(tagFilter) : true;
      return matchStatus && matchTag;
    });

    result.sort((a, b) => {
      if (sortBy === "priority") {
        const pMap = { high: 3, medium: 2, low: 1 };
        return pMap[b.priority] - pMap[a.priority];
      }
      if (sortBy === "completedCount") {
        return b.completedCount - a.completedCount;
      }
      if (sortBy === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      // createdAt 預設由新到舊
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [wishes, statusFilter, tagFilter, sortBy]);

  const activeStatusClass = isRemus
    ? "bg-blue-500 text-white shadow-md shadow-blue-500/20"
    : "bg-pink-500 text-white shadow-md shadow-pink-500/20";

  return (
    <div className="space-y-4">
      {/* 篩選器與排序工具列 */}
      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
        {/* 狀態切換 */}
        <div className="flex flex-col items-stretch gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full gap-1.5 overflow-x-auto p-1 bg-gray-100 dark:bg-gray-700/60 rounded-2xl sm:w-auto">
            <button
                className={`px-3.5 py-2 rounded-xl text-sm sm:text-xs font-semibold transition-all ${
                statusFilter === "open"
                  ? activeStatusClass
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
              onClick={() => setStatusFilter("open")}
            >
              未完成 ({wishes.filter((w) => w.status === "open").length})
            </button>
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === "completed"
                  ? activeStatusClass
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
              onClick={() => setStatusFilter("completed")}
            >
              已完成 ({wishes.filter((w) => w.status === "completed").length})
            </button>
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === "all"
                  ? activeStatusClass
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
              }`}
              onClick={() => setStatusFilter("all")}
            >
              全部 ({wishes.length})
            </button>
          </div>

          {/* 排序選單 */}
          <div className="w-full flex-shrink-0 sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm sm:w-auto sm:text-xs"
            >
              <option value="createdAt">🕒 建立日期 (最新)</option>
              <option value="priority">🔥 優先級 (高到低)</option>
              <option value="completedCount">🎉 完成次數 (最多)</option>
              <option value="deadline">📅 截止日期 (最接近)</option>
            </select>
          </div>
        </div>

        {/* Tag 標籤速選列 */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
            <span className="text-sm sm:text-xs text-gray-400 font-medium flex-shrink-0 mr-1">Tag:</span>
            <button
              onClick={() => setTagFilter(null)}
              className={`px-3 py-1.5 rounded-lg text-sm sm:text-xs font-medium flex-shrink-0 transition-all ${
                tagFilter === null
                  ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-300"
                  : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
              }`}
            >
              全部 Tag
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(tagFilter === t ? null : t)}
                className={`px-3 py-1.5 rounded-lg text-sm sm:text-xs font-medium flex-shrink-0 transition-all ${
                  tagFilter === t
                    ? "bg-purple-500 text-white shadow-xs"
                    : "bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 願望卡片列表 */}
      {filteredAndSorted.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center shadow-sm border border-gray-100 dark:border-gray-700 my-6">
          <div className="text-4xl mb-3">🎈</div>
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-200 mb-1">
            尚無相符的許願項目
          </h3>
          <p className="text-sm text-gray-400">
            {statusFilter === "open"
              ? "目前沒有未完成的願望，快點擊「新增願望」許下你們的心願吧！"
              : "試試切換其他 Tag 或篩選條件看看。"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {filteredAndSorted.map((w) => (
            <WishCard key={w.id} wish={w} />
          ))}
        </div>
      )}
    </div>
  );
}
