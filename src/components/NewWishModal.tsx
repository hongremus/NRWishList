import React, { useState } from "react";
import { useStore } from "../store";
import { Wish, Priority } from "../types";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export default function NewWishModal({ onClose }: { onClose: () => void }) {
  useBodyScrollLock();
  const addWish = useStore((s) => s.addWish);
  const currentUser = useStore((s) => s.currentUser);
  const availableTags = useStore((s) => s.availableTags);
  const addTagToStore = useStore((s) => s.addTag);

  const isRemus = currentUser?.username === "Remus";

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [region, setRegion] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [tagError, setTagError] = useState(false);
  const [priority, setPriority] = useState<Priority>("medium");
  const [deadline, setDeadline] = useState<string>("");

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      const nextTags = selectedTags.filter((t) => t !== tag);
      setSelectedTags(nextTags);
      setTagError(nextTags.length === 0);
    } else {
      setSelectedTags([...selectedTags, tag]);
      setTagError(false);
    }
  }

  function handleAddCustomTag() {
    const trimmed = customTag.trim();
    if (trimmed) {
      addTagToStore(trimmed);
      if (!selectedTags.includes(trimmed)) {
        setSelectedTags([...selectedTags, trimmed]);
      }
      setTagError(false);
      setCustomTag("");
    }
  }

  function submit() {
    if (!title.trim()) return;
    if (selectedTags.length === 0) {
      setTagError(true);
      return;
    }

    const w: Wish = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: desc.trim(),
      region: region || undefined,
      tags: selectedTags,
      priority,
      proposedBy: currentUser?.username === "Remus" ? "me" : "gf",
      assignedTo: "both",
      deadline: deadline || null,
      status: "open",
      createdAt: new Date().toISOString(),
      completedCount: 0,
      history: [],
    };
    addWish(w);
    onClose();
  }

  const themeBtnClass = isRemus
    ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/20"
    : "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/20";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[calc(100dvh-1rem)] sm:max-h-[90vh] overflow-y-auto overscroll-contain">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-2xl">✨</span>
            <h3 className="truncate text-xl font-bold text-gray-900 dark:text-gray-100">許願</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* 標題 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">願望名 *</label>
            <input
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
              placeholder="例如：一齊去日本參加夏祭 🎆"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">詳情 / 備註</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white resize-none"
              placeholder="寫低想做嘅事、想去嘅地方或者其他諗法..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">地區（可以唔填）</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="例如：尖沙咀、沙田、銅鑼灣"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
            />
          </div>

          {/* 標籤選擇區 (直接點選，不用手打) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
              揀 Tag * <span className="font-normal text-gray-400">(最少揀一個)</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2 max-h-32 overflow-y-auto p-1">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 flex items-center gap-1 border ${
                      isSelected
                        ? isRemus
                          ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                          : "bg-pink-500 text-white border-pink-500 shadow-sm"
                        : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>#{tag}</span>
                    {isSelected && <span className="text-xs">✓</span>}
                  </button>
                );
              })}
            </div>

            {tagError && (
              <p className="mt-1 text-xs font-medium text-red-500">要揀最少一個 Tag 先可以加入願望。</p>
            )}

            {/* 自訂 Tag 輸入 */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
                placeholder="+ 自己加個分類"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-xl hover:bg-gray-300 active:scale-95 transition-all"
              >
                加入
              </button>
            </div>
          </div>

          {/* 優先度 & 截止日期 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">優先度</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
              >
                <option value="high">🔴 高</option>
                <option value="medium">🟡 中</option>
                <option value="low">🔵 低</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">截止日（可以唔填）</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="min-w-0 flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
                />
                {deadline && (
                  <button
                    type="button"
                    onClick={() => setDeadline("")}
                    className="shrink-0 rounded-xl bg-gray-100 px-3 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 按鈕組 */}
          <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="button"
              disabled={!title.trim() || selectedTags.length === 0}
              className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${themeBtnClass}`}
              onClick={submit}
            >
              許願 💕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
