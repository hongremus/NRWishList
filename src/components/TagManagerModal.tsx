import React, { useState } from "react";
import { useStore } from "../store";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

export default function TagManagerModal({ onClose }: { onClose: () => void }) {
  useBodyScrollLock();
  const availableTags = useStore((s) => s.availableTags);
  const addTag = useStore((s) => s.addTag);
  const deleteTag = useStore((s) => s.deleteTag);
  const currentUser = useStore((s) => s.currentUser);
  const isRemus = currentUser?.username === "Remus";

  const [newTagInput, setNewTagInput] = useState("");

  function handleAdd() {
    if (newTagInput.trim()) {
      addTag(newTagInput.trim());
      setNewTagInput("");
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[85vh] overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-xl">🏷️</span>
            <h3 className="truncate text-lg font-bold text-gray-900 dark:text-gray-100">管理 Tag</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          自己加啲常用 Tag，之後加願望或者篩選嗰陣可以直接揀。
        </p>

        {/* 新增 Tag 輸入框 */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
            placeholder="打新 Tag 名（例如：踩點）"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className={`px-4 py-2.5 text-white font-medium text-sm rounded-xl active:scale-95 transition-all shadow-md ${
              isRemus ? "bg-blue-500 hover:bg-blue-600" : "bg-pink-500 hover:bg-pink-600"
            }`}
          >
            加入
          </button>
        </div>

        {/* 現有 Tag 列表 */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">而家有嘅 Tag ({availableTags.length})</div>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-medium border border-purple-100 dark:border-purple-800"
              >
                #{tag}
                <button
                  onClick={() => deleteTag(tag)}
                  className="w-4 h-4 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 flex items-center justify-center text-xs text-purple-500"
                  title="刪除 Tag"
                >
                  ×
                </button>
              </span>
            ))}
            {availableTags.length === 0 && (
              <div className="text-xs text-gray-400 py-4 text-center w-full">未有 Tag，喺上面加一個啦。</div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-right">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 border border-gray-700 rounded-xl font-medium text-sm active:scale-95 transition-all"
          >
            搞掂
          </button>
        </div>
      </div>
    </div>
  );
}
