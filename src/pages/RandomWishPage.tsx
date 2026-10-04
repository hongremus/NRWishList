import React, { useMemo, useState } from "react";
import { useStore } from "../store";
import { Wish } from "../types";
import ConfirmModal from "../components/ConfirmModal";

const MINIMUM_RATING = 7;

function hasQualifiedHistory(wish: Wish) {
  return wish.status === "completed" && wish.history.some(
    (history) =>
      typeof history.averageRating === "number" &&
      history.averageRating >= MINIMUM_RATING,
  );
}

export default function RandomWishPage() {
  const wishes = useStore((state) => state.wishes);
  const availableTags = useStore((state) => state.availableTags);
  const updateWish = useStore((state) => state.updateWish);
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null);
  const [drawnWish, setDrawnWish] = useState<Wish | null>(null);

  const eligibleWishes = useMemo(
    () => wishes.filter(hasQualifiedHistory),
    [wishes],
  );
  const filteredWishes = useMemo(
    () => selectedTag === "all"
      ? eligibleWishes
      : eligibleWishes.filter((wish) => wish.tags.includes(selectedTag)),
    [eligibleWishes, selectedTag],
  );
  const poolTags = useMemo(
    () => availableTags.filter((tag) => eligibleWishes.some((wish) => wish.tags.includes(tag))),
    [availableTags, eligibleWishes],
  );

  function drawWish() {
    if (filteredWishes.length === 0) {
      setDrawnWish(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredWishes.length);
    const wish = filteredWishes[randomIndex];
    setDrawnWish(wish);
    setSelectedWish(wish);
  }

  function repeatWish() {
    if (!selectedWish) return;
    updateWish({ ...selectedWish, status: "open" });
    setSelectedWish(null);
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="rounded-3xl bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 p-5 text-white shadow-lg sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wide text-white/75">Random Date</p>
        <h2 className="mt-1 text-2xl font-black sm:text-3xl">諗唔到做咩？</h2>
        <p className="mt-2 max-w-md text-sm text-white/85">
          從以前做過而且有 7 分或以上嘅願望入面，公平咁抽一樣。
        </p>
        <button
          type="button"
          onClick={drawWish}
          className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-rose-600 shadow-md transition-transform active:scale-95"
        >
          🎲 幫我揀一樣
        </button>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">揀個類型</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Pool 入面有 {filteredWishes.length} 個願望
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
            7+ 分
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedTag("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${selectedTag === "all" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}
          >
            全部
          </button>
          {poolTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${selectedTag === tag ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-200"}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </section>

      {drawnWish && (
        <section className="rounded-3xl border border-pink-200 bg-pink-50 p-5 shadow-sm dark:border-pink-900/50 dark:bg-pink-950/20">
          <p className="text-xs font-bold text-pink-600 dark:text-pink-300">今次抽中</p>
          <h3 className="mt-1 break-words text-xl font-black text-gray-900 dark:text-gray-100">
            {drawnWish.title}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
            {drawnWish.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white px-2.5 py-1 dark:bg-gray-800">
                #{tag}
              </span>
            ))}
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
              曾經做過 {drawnWish.completedCount} 次
            </span>
          </div>
        </section>
      )}

      {filteredWishes.length === 0 && (
        <p className="rounded-2xl bg-gray-50 px-4 py-4 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-300">
          呢個 Tag 暫時未有 7 分或以上嘅已完成願望。
        </p>
      )}

      <ConfirmModal
        isOpen={Boolean(selectedWish)}
        title="要唔要再做一次？"
        message={selectedWish ? `抽中咗「${selectedWish.title}」，要將佢放返入未完成清單？` : ""}
        confirmText="再做一次"
        cancelText="Close"
        onConfirm={repeatWish}
        onCancel={() => setSelectedWish(null)}
      />
    </div>
  );
}
