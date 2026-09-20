import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Priority, Wish, WishHistory } from "../types";
import { useStore } from "../store";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

const MAX_RATING = 10;

function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(/(\r?\n|(?:https?:\/\/|www\.)[^\s]+|(?:instagram\.com|threads\.net)\/[^\s]+)/gi);

  return (
    <>
      {parts.map((part, index) => {
        if (/^\r?\n$/.test(part)) return <br key={index} />;

        const match = part.match(/^(.*?)([.,!?;:)]+)?$/);
        const candidate = match?.[1] || part;
        const punctuation = match?.[2] || "";
        const isUrl = /^(?:https?:\/\/|www\.|instagram\.com\/|threads\.net\/)/i.test(candidate);

        if (!isUrl) return <React.Fragment key={index}>{part}</React.Fragment>;

        const href = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
        return (
          <React.Fragment key={index}>
            <a href={href} target="_blank" rel="noreferrer" className="break-all text-blue-600 hover:underline dark:text-blue-300">
              {candidate}
            </a>
            {punctuation}
          </React.Fragment>
        );
      })}
    </>
  );
}

export default function WishModal({ wish, onClose }: { wish: Wish; onClose: () => void }) {
  const update = useStore((s) => s.updateWish);
  const currentUser = useStore((s) => s.currentUser);
  const isRemus = currentUser?.username === "Remus";

  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(wish.title);
  const [desc, setDesc] = useState(wish.description || "");
  const [region, setRegion] = useState(wish.region || "");
  const [address, setAddress] = useState(wish.address || "");
  const [deadline, setDeadline] = useState(wish.deadline || "");
  const [priority, setPriority] = useState<Priority>(wish.priority);
  const [selectedTags, setSelectedTags] = useState<string[]>(wish.tags);
  const availableTags = useStore((s) => s.availableTags);

  // 用於評分介面的 state
  const [activeRatingHistoryId, setActiveRatingHistoryId] = useState<string | null>(null);
  const [ratingRole, setRatingRole] = useState<"me" | "gf">(isRemus ? "me" : "gf");
  const [ratingVal, setRatingVal] = useState<number>(MAX_RATING);
  const [remarkText, setRemarkText] = useState<string>("");

  useBodyScrollLock();

  async function save() {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await update({
        ...wish,
        title: title.trim(),
        description: desc.trim(),
        region: region || undefined,
        address: address || undefined,
        deadline: deadline || null,
        priority,
        tags: selectedTags,
      });
      setEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function lockHistoryItem(hId: string) {
    const nw = {
      ...wish,
      history: wish.history.map((h) => (h.id === hId ? { ...h, isLocked: true } : h)),
    };
    update(nw);
  }

  function submitRating(hId: string) {
    const nw = {
      ...wish,
      history: wish.history.map((h) => {
        if (h.id !== hId) return h;
        const newRatings = { ...h.ratings, [ratingRole]: ratingVal };
        const newRemarks = { ...h.remarks, [ratingRole]: remarkText.trim() };

        const ratingVals: number[] = [];
        if (newRatings.me) ratingVals.push(newRatings.me);
        if (newRatings.gf) ratingVals.push(newRatings.gf);

        const avgVal = ratingVals.length
          ? Math.round((ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length) * 10) / 10
          : undefined;

        return { ...h, ratings: newRatings, remarks: newRemarks, averageRating: avgVal };
      }),
    };
    update(nw);
    setActiveRatingHistoryId(null);
    setRemarkText("");
  }

  function openRatingForm(h: WishHistory, role: "me" | "gf") {
    setActiveRatingHistoryId(h.id);
    setRatingRole(role);
    setRatingVal(h.ratings[role] || MAX_RATING);
    setRemarkText(h.remarks[role] || "");
  }

  function getRatingStatusText(completedAtStr: string, isLocked?: boolean) {
    if (isLocked) return { text: "🔒 評分已鎖住", canRate: false };
    const compTime = new Date(completedAtStr).getTime();
    if (isNaN(compTime)) return { text: "可以俾分", canRate: true };

    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
    const diff = compTime + TWO_DAYS_MS - Date.now();
    if (diff <= 0) {
      return { text: "⏰ 評分時間過咗", canRate: false };
    }

    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minsLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return {
      text: `⏳ 仲有 ${hoursLeft}個鐘 ${minsLeft}分鐘可以俾分`,
      canRate: true,
    };
  }

  return createPortal(
    (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 w-full max-w-2xl shadow-2xl border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700 mb-4">
          <div className="min-w-0 flex-1 pr-2 sm:pr-4">
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-1 ${
                wish.status === "completed"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
              }`}
            >
              {wish.status === "completed" ? "✓ 搞掂咗" : "⏳ 做緊"}
            </span>
            <h2 className="break-words text-xl font-bold text-gray-900 dark:text-gray-100">{wish.title}</h2>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 transition-all"
            >
              {editing ? "取消" : "✏️ 修改"}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Edit mode vs Normal view */}
        {editing ? (
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">標題</label>
              <input
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">詳情</label>
              <textarea
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white resize-none"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                  }
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">地區（可以唔填）</label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="例如：尖沙咀、沙田、銅鑼灣"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">地址（可以唔填）</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="例如：尖沙咀海港城"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">截止日（可以唔填）</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="min-w-0 flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
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
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">優先度</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-white"
              >
                <option value="high">🔴 高</option>
                <option value="medium">🟡 中</option>
                <option value="low">🔵 低</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Tag</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTags((current) => selected ? current.filter((item) => item !== tag) : [...current, tag])}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                        selected
                          ? isRemus ? "border-blue-500 bg-blue-500 text-white" : "border-pink-500 bg-pink-500 text-white"
                          : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      #{tag}{selected ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={save}
                disabled={isSaving}
                className={`px-5 py-2 text-white font-medium text-sm rounded-xl active:scale-95 transition-all shadow-md ${
                  isSaving
                    ? "cursor-wait bg-gray-400"
                    : isRemus ? "bg-blue-500 hover:bg-blue-600" : "bg-pink-500 hover:bg-pink-600"
                }`}
              >
                {isSaving ? "同步中…" : "儲存"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {wish.description && (
              <p className="whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                <LinkifiedText text={wish.description} />
              </p>
            )}
            {wish.region && (
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                📍 地區：{wish.region}
              </p>
            )}
            {wish.address && (
              <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                🏠 地址：{wish.address}{" "}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wish.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-blue-600 hover:underline"
                >
                  開 Google Maps
                </a>
              </p>
            )}

            {/* 願望屬性標籤 */}
            <div className="flex flex-wrap gap-2 text-xs">
              {wish.tags.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium"
                >
                  #{t}
                </span>
              ))}
              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                完成咗 {wish.completedCount} 次
              </span>
              {wish.deadline && (
                <span className="px-2.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg">
                  📅 截止日：{wish.deadline}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 歷史完成紀錄 & 評分 Remark 區塊 */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base flex items-center gap-1.5">
              <span>📜</span> 完成紀錄 ({wish.history.length})
            </h3>
          </div>

          {wish.history.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 dark:bg-gray-700/30 rounded-2xl">
              仲未完成過，搞掂咗之後就會喺呢度有紀錄！
            </div>
          ) : (
            <div className="relative space-y-4 pl-4 before:absolute before:bottom-4 before:left-1.5 before:top-4 before:w-px before:bg-purple-200 dark:before:bg-purple-800">
              {wish.history.map((h, index) => {
                const statusInfo = getRatingStatusText(h.completedAt, h.isLocked);
                const isFormOpen = activeRatingHistoryId === h.id;

                return (
                  <div
                    key={h.id}
                    className="relative p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-600 space-y-3 before:absolute before:-left-[1.25rem] before:top-5 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-white before:bg-purple-500 dark:before:border-gray-900"
                  >
                    <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 dark:text-gray-400 gap-1">
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        第 {wish.history.length - index} 次完成
                      </span>
                      <span>{new Date(h.completedAt).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-300">
                        平均分：{" "}
                        <span className="font-bold text-amber-500 text-sm">
                          {h.averageRating ? `⭐ ${h.averageRating}/10` : "暫無"}
                        </span>
                      </span>
                      <span className="text-gray-400 font-medium">{statusInfo.text}</span>
                    </div>

                    {/* 雙方 Rating & Remarks 顯示 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 bg-blue-50/60 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center justify-between">
                          <span>👦🏻 Remus</span>
                          <span>{h.ratings.me ? `⭐ ${h.ratings.me}/10` : "未俾分"}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-gray-600 dark:text-gray-300 italic">
                          {h.remarks.me ? <>"<LinkifiedText text={h.remarks.me} />"</> : "未有 Remark"}
                        </p>
                      </div>

                      <div className="p-2.5 bg-pink-50/60 dark:bg-pink-900/20 rounded-xl border border-pink-100 dark:border-pink-900/30">
                        <div className="font-semibold text-pink-700 dark:text-pink-300 mb-1 flex items-center justify-between">
                          <span>👧🏻 Nicole</span>
                          <span>{h.ratings.gf ? `⭐ ${h.ratings.gf}/10` : "未俾分"}</span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-gray-600 dark:text-gray-300 italic">
                          {h.remarks.gf ? <>"<LinkifiedText text={h.remarks.gf} />"</> : "未有 Remark"}
                        </p>
                      </div>
                    </div>

                    {/* 評分按鈕 / 表單 (無需 prompt!) */}
                    {statusInfo.canRate && !h.isLocked && (
                      <div className="pt-2">
                        {!isFormOpen ? (
                          <div className="flex flex-wrap gap-2">
                            {isRemus ? (
                              <button
                                onClick={() => openRatingForm(h, "me")}
                                className="px-3 py-1.5 bg-blue-500 text-white rounded-xl text-xs font-medium active:scale-95 transition-all shadow-sm"
                              >
                                👦🏻 Remus 俾分
                              </button>
                            ) : (
                              <button
                                onClick={() => openRatingForm(h, "gf")}
                                className="px-3 py-1.5 bg-pink-500 text-white rounded-xl text-xs font-medium active:scale-95 transition-all shadow-sm"
                              >
                                👧🏻 Nicole 俾分
                              </button>
                            )}
                            <button
                              onClick={() => lockHistoryItem(h.id)}
                              className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium hover:bg-gray-300 transition-all ml-auto"
                            >
                              🔒 提前鎖住
                            </button>
                          </div>
                        ) : (
                          /* 內嵌評分表單 */
                          <div className="p-3 bg-white dark:bg-gray-900 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-3 animate-fadeIn">
                            <div className="flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-300">
                              <span>俾分 — {ratingRole === "me" ? "Remus" : "Nicole"}</span>
                              <button
                                onClick={() => setActiveRatingHistoryId(null)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                取消
                              </button>
                            </div>

                            {/* 星星點選 */}
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-xs text-gray-500 mr-2">星星：</span>
                              {Array.from({ length: MAX_RATING }, (_, index) => index + 1).map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setRatingVal(star)}
                                  className="text-lg active:scale-125 transition-all"
                                >
                                  {star <= ratingVal ? "⭐" : "☆"}
                                </button>
                              ))}
                              <span className="text-xs font-bold text-amber-500 ml-2">{ratingVal}/10 分</span>
                            </div>

                            {/* Remark TextArea */}
                            <div>
                              <textarea
                                rows={2}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs dark:text-white resize-none"
                                placeholder="你對今次願望有咩感受或者想講嘅嘢..."
                                value={remarkText}
                                onChange={(e) => setRemarkText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.stopPropagation();
                                  }
                                }}
                              />
                            </div>

                            <button
                              onClick={() => submitRating(h.id)}
                              className={`w-full py-2 text-white font-medium text-xs rounded-xl shadow-md active:scale-95 transition-all ${
                                ratingRole === "me" ? "bg-blue-500" : "bg-pink-500"
                              }`}
                            >
                              送出分數同 Remark ✨
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
    ),
    document.body,
  );
}
