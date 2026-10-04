import React, { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store";
import { Wish } from "../types";
import ConfirmModal from "../components/ConfirmModal";

const MINIMUM_RATING = 7;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const RECENCY_RAMP_DAYS = 90;

function hasQualifiedHistory(wish: Wish) {
  return wish.status === "completed" && wish.history.some(
    (history) =>
      typeof history.averageRating === "number" &&
      history.averageRating >= MINIMUM_RATING,
  );
}

function getWishAverageRating(wish: Wish) {
  const ratings = wish.history
    .map((history) => history.averageRating)
    .filter((rating): rating is number => typeof rating === "number");
  if (ratings.length === 0) return 0;
  return ratings.reduce((total, rating) => total + rating, 0) / ratings.length;
}

function getWishStats(wish: Wish) {
  const averageRating = getWishAverageRating(wish);
  const completedTimes = wish.history
    .map((history) => new Date(history.completedAt).getTime())
    .filter((time) => Number.isFinite(time));
  const latestCompletionTime = completedTimes.length > 0
    ? Math.max(...completedTimes)
    : Date.now() - RECENCY_RAMP_DAYS * DAY_IN_MS;
  const daysSinceLastCompletion = Math.max(
    0,
    Math.floor((Date.now() - latestCompletionTime) / DAY_IN_MS),
  );
  const scoreWeight = averageRating / 10;
  const recencyWeight = 0.5 + Math.min(daysSinceLastCompletion / RECENCY_RAMP_DAYS, 1.5);

  return {
    averageRating,
    latestCompletionTime,
    daysSinceLastCompletion,
    weight: scoreWeight * recencyWeight,
  };
}

function formatDrawChance(weight: number, totalWeight: number) {
  if (totalWeight === 0) return "0%";
  const percentage = ((weight / totalWeight) * 100).toFixed(1);
  return `${percentage}%`;
}

export default function RandomWishPage() {
  const wishes = useStore((state) => state.wishes);
  const availableTags = useStore((state) => state.availableTags);
  const updateWish = useStore((state) => state.updateWish);
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedWish, setSelectedWish] = useState<Wish | null>(null);
  const [drawnWish, setDrawnWish] = useState<Wish | null>(null);
  const [rollingWish, setRollingWish] = useState<Wish | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const animationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (animationTimer.current) clearTimeout(animationTimer.current);
    if (animationInterval.current) clearInterval(animationInterval.current);
  }, []);

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
  const totalWeight = useMemo(
    () => filteredWishes.reduce((total, wish) => total + getWishStats(wish).weight, 0),
    [filteredWishes],
  );
  const poolTags = useMemo(
    () => availableTags.filter((tag) => eligibleWishes.some((wish) => wish.tags.includes(tag))),
    [availableTags, eligibleWishes],
  );

  function drawWish() {
    if (filteredWishes.length === 0 || isDrawing) {
      setDrawnWish(null);
      return;
    }
    const randomValue = Math.random() * totalWeight;
    let accumulatedWeight = 0;
    const wish = filteredWishes.find((candidate) => {
      accumulatedWeight += getWishStats(candidate).weight;
      return randomValue < accumulatedWeight;
    }) ?? filteredWishes[filteredWishes.length - 1];
    setSelectedWish(null);
    setDrawnWish(null);
    setRollingWish(filteredWishes[0]);
    setIsDrawing(true);
    animationInterval.current = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * filteredWishes.length);
      setRollingWish(filteredWishes[randomIndex]);
    }, 120);
    animationTimer.current = setTimeout(() => {
      if (animationInterval.current) clearInterval(animationInterval.current);
      animationInterval.current = null;
      setRollingWish(null);
      setIsDrawing(false);
      setDrawnWish(wish);
      setSelectedWish(wish);
    }, 2400);
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
          從以前做過而且有 7 分或以上嘅願望入面抽一樣。
        </p>
        <button
          type="button"
          onClick={drawWish}
          disabled={isDrawing || filteredWishes.length === 0}
          className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-rose-600 shadow-md transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-70"
        >
          {isDrawing ? "🎰 抽緊…" : "🎲 幫我揀一樣"}
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
              disabled={isDrawing}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${selectedTag === "all" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}
          >
            全部
          </button>
          {poolTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              disabled={isDrawing}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${selectedTag === tag ? "bg-pink-500 text-white" : "bg-pink-50 text-pink-700 dark:bg-pink-950/30 dark:text-pink-200"}`}
            >
              #{tag}
            </button>
          ))}
        </div>
        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-800">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>可能抽中嘅 option</span>
            <span>分數高、耐冇做較易抽中</span>
          </div>
          {filteredWishes.length > 0 ? (
            <div className="space-y-2">
              {filteredWishes.map((wish) => (
                (() => {
                  const stats = getWishStats(wish);
                  return (
                    <div
                      key={wish.id}
                      className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2.5 dark:bg-gray-800"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">
                          {wish.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                          平均 {stats.averageRating.toFixed(1)} 分 · 上次做係 {stats.daysSinceLastCompletion} 日前
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-pink-100 px-2 py-1 text-[11px] font-black text-pink-700 dark:bg-pink-900/40 dark:text-pink-200">
                        抽中 {formatDrawChance(stats.weight, totalWeight)}
                      </span>
                    </div>
                  );
                })()
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-gray-50 px-3 py-3 text-xs text-gray-400 dark:bg-gray-800">
              呢個 Tag 暫時未有合資格 option
            </p>
          )}
        </div>
      </section>

      {isDrawing && rollingWish && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-300">抽緊中…</p>
          <div className="mt-2 flex min-h-14 items-center justify-center rounded-2xl bg-white px-4 text-center shadow-inner dark:bg-gray-900">
            <span className="animate-pulse break-words text-xl font-black text-gray-900 dark:text-gray-100">
              {rollingWish.title}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-500" />
          </div>
        </section>
      )}

      {!isDrawing && drawnWish && (
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
