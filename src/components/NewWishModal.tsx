import React, { useState } from "react";
import { useStore } from "../store";
import { Wish, Priority, AssignedTo } from "../types";

export default function NewWishModal({ onClose }: { onClose: () => void }) {
  const addWish = useStore((s) => s.addWish);
  const currentUser = useStore((s) => s.currentUser);
  const availableTags = useStore((s) => s.availableTags);
  const addTagToStore = useStore((s) => s.addTag);

  const isRemus = currentUser?.username === "Remus";

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [assignedTo, setAssignedTo] = useState<AssignedTo>("both");
  const [deadline, setDeadline] = useState<string>("");

  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  function handleAddCustomTag() {
    const trimmed = customTag.trim();
    if (trimmed) {
      addTagToStore(trimmed);
      if (!selectedTags.includes(trimmed)) {
        setSelectedTags([...selectedTags, trimmed]);
      }
      setCustomTag("");
    }
  }

  function submit() {
    if (!title.trim()) return;

    const w: Wish = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: desc.trim(),
      tags: selectedTags,
      priority,
      proposedBy: currentUser?.username === "Remus" ? "me" : "gf",
      assignedTo,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-2xl">✨</span>
            <h3 className="truncate text-xl font-bold text-gray-900 dark:text-gray-100">新增許願清單</h3>
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
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">願望標題 *</label>
            <input
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
              placeholder="例如：一齊去日本睇櫻花 🌸"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">願望詳情 / 備註</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white resize-none"
              placeholder="有咩具體想做嘅事、地點或想法..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          {/* 標籤選擇區 (直接點選，不用手打) */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">
              選擇 Tag 分類 <span className="font-normal text-gray-400">(點擊選擇)</span>
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

            {/* 自訂 Tag 輸入 */}
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
                placeholder="+ 自訂新 Tag"
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
                加入 Tag
              </button>
            </div>
          </div>

          {/* 優先級 & 負責人 & 截止日期 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">優先級</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
              >
                <option value="high">🔴 高優先級</option>
                <option value="medium">🟡 中優先級</option>
                <option value="low">🔵 低優先級</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">誰負責實現</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value as AssignedTo)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
              >
                <option value="both">👥 共同實現</option>
                <option value="me">👦🏻 Remus 負責</option>
                <option value="gf">👧🏻 Nicole 負責</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">截止日期 (可選)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
              />
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
              disabled={!title.trim()}
              className={`flex-1 py-2.5 text-white rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${themeBtnClass}`}
              onClick={submit}
            >
              建立願望 💕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
