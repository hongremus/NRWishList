import React, { useState } from "react";
import { useStore } from "../store";

export default function TagManagerModal({ onClose }: { onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">管理 Tag 標籤</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          自訂常用標籤，新增願望或篩選時可以直接點擊選擇。
        </p>

        {/* 新增 Tag 輸入框 */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:text-white"
            placeholder="輸入新標籤名稱 (如: 踩點)"
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
            新增
          </button>
        </div>

        {/* 現有 Tag 列表 */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">已有標籤 ({availableTags.length})</div>
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
                  title="刪除標籤"
                >
                  ×
                </button>
              </span>
            ))}
            {availableTags.length === 0 && (
              <div className="text-xs text-gray-400 py-4 text-center w-full">尚無任何標籤，請在上方新增。</div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-right">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium text-sm active:scale-95 transition-all"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
