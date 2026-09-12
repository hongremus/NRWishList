import React, { useState } from "react";
import { Wish } from "../types";
import { useStore } from "../store";
import WishModal from "./WishModal";
import ConfirmModal from "./ConfirmModal";

export default function WishCard({ wish, onDetailChange }: { wish: Wish; onDetailChange: (isOpen: boolean) => void }) {
  const update = useStore((s) => s.updateWish);
  const deleteWish = useStore((s) => s.deleteWish);
  const currentUser = useStore((s) => s.currentUser);
  const isRemus = currentUser?.username === "Remus";

  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  function openDetail() {
    setShowDetail(true);
    onDetailChange(true);
  }

  function closeDetail() {
    setShowDetail(false);
    onDetailChange(false);
  }

  function handleConfirmComplete() {
    if (wish.status === "open") {
      const h = {
        id: crypto.randomUUID(),
        completedAt: new Date().toISOString(),
        completedBy: currentUser?.displayName || currentUser?.username || "未知",
        ratings: {},
        remarks: {},
        averageRating: undefined,
        isLocked: false,
      };
      const nw = {
        ...wish,
        status: "completed" as const,
        completedCount: wish.completedCount + 1,
        history: [h, ...wish.history],
      };
      update(nw);
    }
    setShowCompleteConfirm(false);
  }

  function handleConfirmDelete() {
    deleteWish(wish.id);
    setShowDeleteConfirm(false);
  }

  function handleConfirmReset() {
    update({ ...wish, status: "open" });
    setShowResetConfirm(false);
  }

  // 最新歷史紀錄的評分
  const latestHistory = wish.history[0];

  const priorityColor =
    wish.priority === "high"
      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200"
      : wish.priority === "medium"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200"
      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200";

  const priorityLabel = wish.priority === "high" ? "🔴 高" : wish.priority === "medium" ? "🟡 中" : "🔵 低";

  return (
    <div
      className={`p-4 rounded-3xl transition-all shadow-md hover:shadow-lg border ${
        wish.status === "completed"
          ? "bg-gray-50/90 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 opacity-90"
          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
      } cursor-pointer`}
      onClick={openDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openDetail();
        }
      }}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3
              className={`font-bold text-base sm:text-lg ${
                wish.status === "completed"
                  ? "line-through text-gray-400 dark:text-gray-500"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {wish.title}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${priorityColor}`}>
              {priorityLabel}
            </span>
          </div>

          {wish.description && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              {wish.description}
            </p>
          )}
          {wish.region && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">📍 {wish.region}</p>}
        </div>

        {/* 完成次數徽章 */}
        <div className="text-right flex-shrink-0">
          <span className="inline-block px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold rounded-xl text-xs">
            🎉 {wish.completedCount} 次
          </span>
        </div>
      </div>

      {/* Tags 分類 */}
      <div className="flex flex-wrap gap-1.5 my-2">
        {wish.tags.map((t) => (
          <span
            key={t}
            className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md font-medium"
          >
            #{t}
          </span>
        ))}
      </div>

      {/* 截止日 & 評分資訊 */}
      <div className="flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700 my-2 gap-y-1">
        <div className="flex items-center gap-3">
          {wish.deadline && (
            <span className="text-red-500 dark:text-red-400 font-medium">
              ⏰ {wish.deadline}
            </span>
          )}
        </div>
        {latestHistory?.averageRating && (
          <div className="text-amber-500 font-bold">
            最新分數: ⭐ {latestHistory.averageRating}
          </div>
        )}
      </div>

      {/* 操作按鈕組 */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-stretch gap-2 pt-2 sm:flex">
        {wish.status === "open" ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              setShowCompleteConfirm(true);
            }}
            className={`min-w-0 flex-1 py-2.5 px-2 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 sm:px-3 ${
              isRemus
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-blue-500/20"
                : "bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/20"
            }`}
          >
            <span>✓</span>
            <span>搞掂咗</span>
          </button>
        ) : (
          <button
            disabled
            className="min-w-0 flex-1 whitespace-nowrap py-2.5 px-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl text-xs font-medium cursor-default text-center sm:px-3"
          >
            ✓ 搞掂咗
          </button>
        )}

        <button
          onClick={(event) => {
            event.stopPropagation();
            if (wish.status === "completed") {
              setShowResetConfirm(true);
            } else {
              openDetail();
            }
          }}
          className="min-w-0 flex-1 py-2.5 px-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 rounded-xl text-xs font-medium active:scale-95 transition-all sm:px-3"
        >
          {wish.status === "completed" ? "↺ 再做一次" : "詳情 / 評分"}
        </button>

        <button
          onClick={(event) => {
            event.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="py-2 px-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-xs font-medium active:scale-95 transition-all"
          title="刪除"
        >
          🗑️
        </button>
      </div>

      {showDetail && <WishModal wish={wish} onClose={closeDetail} />}

      {/* 刪除確認 Modal (取代 confirm) */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="真係要刪除呢個願望？"
        message={`真係要刪除「${wish.title}」？刪咗就返唔到轉頭喎。`}
        confirmText="刪除"
        cancelText="取消"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
      <ConfirmModal
        isOpen={showResetConfirm}
        title="真係要再做一次？"
        message="重置之後個願望會變返未搞掂，可以再做一次。之前嘅完成紀錄同評分會保留！"
        confirmText="再做啦"
        cancelText="取消"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
      <ConfirmModal
        isOpen={showCompleteConfirm}
        title="確認要搞掂呢個願望？"
        message={`確認將「${wish.title}」轉做完成？`}
        confirmText="搞掂咗"
        cancelText="取消"
        onConfirm={handleConfirmComplete}
        onCancel={() => setShowCompleteConfirm(false)}
      />
    </div>
  );
}
